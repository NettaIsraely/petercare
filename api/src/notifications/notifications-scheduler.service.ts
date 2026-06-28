import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { DateTime } from 'luxon';
import {
  Feeding,
  FeedingStatus,
  ShiftType,
} from '../feedings/entities/feeding.entity';
import { Task } from '../tasks/entities/task.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { FeedingNotificationsService } from './feeding-notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  addDaysToDateStr,
  formatScheduleDate,
  getLocalDateString,
  getStableTimezone,
  isLocalHour,
  isLocalTime,
} from '../common/timezone.util';
import {
  feedingIncompleteAssigneePromptMessage,
  feedingIncompleteBroadcastAssignedMessage,
  feedingIncompleteBroadcastUnassignedMessage,
  taskDeadlineReminderMessage,
  unassignedNightAlertMessage,
} from './notification-messages';

const INCOMPLETE_ASSIGNEE_TIMES: Record<ShiftType, { hour: number; minute: number }> = {
  [ShiftType.MORNING]: { hour: 9, minute: 0 },
  [ShiftType.EVENING]: { hour: 20, minute: 0 },
};

const INCOMPLETE_BROADCAST_TIMES: Record<ShiftType, { hour: number; minute: number }> = {
  [ShiftType.MORNING]: { hour: 10, minute: 0 },
  [ShiftType.EVENING]: { hour: 20, minute: 30 },
};

@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(
    @InjectRepository(Feeding)
    private readonly feedingRepository: Repository<Feeding>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly feedingNotifications: FeedingNotificationsService,
    private readonly notificationPreferences: NotificationPreferencesService,
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0,30 * * * *')
  async handleNotificationScan(): Promise<void> {
    try {
      const nowUtc = DateTime.utc();
      await Promise.all([
        this.processUnassignedNightBeforeAlerts(nowUtc),
        this.processIncompleteAssigneeAlerts(nowUtc),
        this.processIncompleteBroadcastAlerts(nowUtc),
        this.processTaskDeadlineReminders(nowUtc),
      ]);
    } catch (error) {
      this.logger.error('Notification scan failed', error);
    }
  }

  private getStableTimezone(): string {
    return getStableTimezone(this.configService);
  }

  private async processUnassignedNightBeforeAlerts(nowUtc: DateTime): Promise<void> {
    const stableTz = this.getStableTimezone();
    if (!isLocalHour(nowUtc, stableTz, 22)) {
      return;
    }

    const tomorrowStable = addDaysToDateStr(
      getLocalDateString(nowUtc, stableTz),
      1,
    );

    const unassignedFeedings = await this.feedingRepository.find({
      where: {
        schedule_date: tomorrowStable as unknown as Date,
        feeding_status: FeedingStatus.UNASSIGNED,
        unassigned_night_alert_sent_at: IsNull(),
      },
    });

    if (unassignedFeedings.length === 0) {
      return;
    }

    const recipientIds = await this.getOwnerAndCaregiverIds();
    if (recipientIds.length === 0) {
      return;
    }

    for (const feeding of unassignedFeedings) {
      const message = unassignedNightAlertMessage(
        feeding.shift_type,
        feeding.schedule_date,
      );

      const queuedCount = await this.feedingNotifications.notifyUsers(
        recipientIds,
        'unassigned-night-alert',
        message,
        {
          type: 'feeding-unassigned',
          feedingId: feeding.id,
          shiftType: feeding.shift_type,
        },
      );

      if (queuedCount === 0) {
        continue;
      }

      feeding.unassigned_night_alert_sent_at = nowUtc.toJSDate();
      await this.feedingRepository.save(feeding);
    }

    this.logger.log(
      `Sent unassigned-night alerts for ${unassignedFeedings.length} feeding(s)`,
    );
  }

  private async processIncompleteAssigneeAlerts(nowUtc: DateTime): Promise<void> {
    const stableTz = this.getStableTimezone();
    const todayStable = getLocalDateString(nowUtc, stableTz);

    const incompleteFeedings = await this.feedingRepository.find({
      where: {
        feeding_status: Not(FeedingStatus.COMPLETE),
        incomplete_assignee_alert_sent_at: IsNull(),
      },
      relations: { assigned_user: true },
    });

    let sentCount = 0;

    for (const feeding of incompleteFeedings) {
      if (!feeding.assigned_user?.id) {
        continue;
      }

      const scheduleDate = formatScheduleDate(feeding.schedule_date);
      if (scheduleDate !== todayStable) {
        continue;
      }

      const targetTime = INCOMPLETE_ASSIGNEE_TIMES[feeding.shift_type];
      if (!isLocalTime(nowUtc, stableTz, targetTime.hour, targetTime.minute)) {
        continue;
      }

      const queuedCount = await this.feedingNotifications.notifyUsers(
        [feeding.assigned_user.id],
        'feeding-incomplete-assignee-alert',
        feedingIncompleteAssigneePromptMessage(feeding.shift_type),
        {
          type: 'feeding-incomplete-assignee',
          feedingId: feeding.id,
          shiftType: feeding.shift_type,
        },
      );

      if (queuedCount === 0) {
        continue;
      }

      feeding.incomplete_assignee_alert_sent_at = nowUtc.toJSDate();
      await this.feedingRepository.save(feeding);
      sentCount += 1;
    }

    if (sentCount > 0) {
      this.logger.log(`Sent incomplete assignee prompts for ${sentCount} feeding(s)`);
    }
  }

  private async processIncompleteBroadcastAlerts(nowUtc: DateTime): Promise<void> {
    const stableTz = this.getStableTimezone();
    const todayStable = getLocalDateString(nowUtc, stableTz);
    const recipientIds = await this.getOwnerAndCaregiverIds();

    const incompleteFeedings = await this.feedingRepository.find({
      where: {
        feeding_status: Not(FeedingStatus.COMPLETE),
        incomplete_broadcast_alert_sent_at: IsNull(),
      },
      relations: { assigned_user: true },
    });

    let sentCount = 0;

    for (const feeding of incompleteFeedings) {
      const scheduleDate = formatScheduleDate(feeding.schedule_date);
      if (scheduleDate !== todayStable) {
        continue;
      }

      const targetTime = INCOMPLETE_BROADCAST_TIMES[feeding.shift_type];
      if (!isLocalTime(nowUtc, stableTz, targetTime.hour, targetTime.minute)) {
        continue;
      }

      if (recipientIds.length === 0) {
        continue;
      }

      const message = feeding.assigned_user?.name
        ? feedingIncompleteBroadcastAssignedMessage(
            feeding.shift_type,
            feeding.assigned_user.name,
          )
        : feedingIncompleteBroadcastUnassignedMessage(feeding.shift_type);

      const queuedCount = await this.feedingNotifications.notifyUsers(
        recipientIds,
        'feeding-incomplete-broadcast-alert',
        message,
        {
          type: 'feeding-incomplete-broadcast',
          feedingId: feeding.id,
          shiftType: feeding.shift_type,
        },
      );

      if (queuedCount === 0) {
        continue;
      }

      feeding.incomplete_broadcast_alert_sent_at = nowUtc.toJSDate();
      await this.feedingRepository.save(feeding);
      sentCount += 1;
    }

    if (sentCount > 0) {
      this.logger.log(`Sent incomplete broadcast alerts for ${sentCount} feeding(s)`);
    }
  }

  private async processTaskDeadlineReminders(nowUtc: DateTime): Promise<void> {
    const tasks = await this.taskRepository.find({
      where: {
        is_complete: false,
        deadline_reminder_sent_at: IsNull(),
      },
      relations: { assigned_user: true },
    });

    let sentCount = 0;

    for (const task of tasks) {
      if (!task.deadline || !task.assigned_user?.id) {
        continue;
      }

      const stableTz = this.getStableTimezone();
      if (!isLocalHour(nowUtc, stableTz, 22)) {
        continue;
      }

      const tomorrowLocal = addDaysToDateStr(
        getLocalDateString(nowUtc, stableTz),
        1,
      );
      const deadlineDate = formatScheduleDate(task.deadline);

      if (deadlineDate !== tomorrowLocal) {
        continue;
      }

      const eligibleIds = await this.notificationPreferences.filterEligibleUserIds(
        [task.assigned_user.id],
        'task-deadline-reminder',
      );

      if (eligibleIds.length === 0) {
        continue;
      }

      await this.notificationQueue.add('task-deadline-reminder', {
        userId: task.assigned_user.id,
        message: taskDeadlineReminderMessage(task.name),
        data: {
          type: 'task-deadline-reminder',
          taskId: task.id,
        },
      });

      task.deadline_reminder_sent_at = nowUtc.toJSDate();
      await this.taskRepository.save(task);
      sentCount += 1;
    }

    if (sentCount > 0) {
      this.logger.log(`Sent task deadline reminders for ${sentCount} task(s)`);
    }
  }

  private async getOwnerAndCaregiverIds(): Promise<string[]> {
    const users = await this.userRepository.find({
      where: { role: In([UserRole.OWNER, UserRole.CAREGIVER]) },
    });
    return users.map((user) => user.id);
  }
}
