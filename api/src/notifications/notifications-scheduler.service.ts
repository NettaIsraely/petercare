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
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  addDaysToDateStr,
  DEFAULT_STABLE_TIMEZONE,
  formatScheduleDate,
  getLocalDateString,
  isLocalHour,
  resolveUserTimezone,
} from '../common/timezone.util';

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
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 * * * *')
  async handleHourlyNotificationScan(): Promise<void> {
    const nowUtc = DateTime.utc();
    await Promise.all([
      this.processUnassignedNightBeforeAlerts(nowUtc),
      this.processIncompleteFeedingAlerts(nowUtc),
      this.processTaskDeadlineReminders(nowUtc),
    ]);
  }

  private getStableTimezone(): string {
    return (
      this.configService.get<string>('STABLE_TIMEZONE') ??
      DEFAULT_STABLE_TIMEZONE
    );
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
      const dateLabel = formatScheduleDate(feeding.schedule_date);
      const message = `Tomorrow's ${feeding.shift_type} feeding on ${dateLabel} is still unassigned.`;

      await this.feedingNotifications.notifyUsers(
        recipientIds,
        'unassigned-night-alert',
        message,
        {
          type: 'feeding-unassigned',
          feedingId: feeding.id,
          shiftType: feeding.shift_type,
        },
      );

      feeding.unassigned_night_alert_sent_at = nowUtc.toJSDate();
      await this.feedingRepository.save(feeding);
    }

    this.logger.log(
      `Sent unassigned-night alerts for ${unassignedFeedings.length} feeding(s)`,
    );
  }

  private async processIncompleteFeedingAlerts(nowUtc: DateTime): Promise<void> {
    const stableTz = this.getStableTimezone();
    const fallbackRecipientIds = await this.getOwnerAndCaregiverIds();

    const incompleteFeedings = await this.feedingRepository.find({
      where: {
        feeding_status: Not(FeedingStatus.COMPLETE),
        incomplete_alert_sent_at: IsNull(),
      },
      relations: { assigned_user: true },
    });

    let sentCount = 0;

    for (const feeding of incompleteFeedings) {
      const scheduleDate = formatScheduleDate(feeding.schedule_date);
      const targetHour =
        feeding.shift_type === ShiftType.MORNING ? 10 : 21;

      if (feeding.assigned_user?.id) {
        const assigneeTz = resolveUserTimezone(feeding.assigned_user.timezone);
        const todayLocal = getLocalDateString(nowUtc, assigneeTz);

        if (
          !isLocalHour(nowUtc, assigneeTz, targetHour) ||
          scheduleDate !== todayLocal
        ) {
          continue;
        }

        await this.feedingNotifications.notifyUsers(
          [feeding.assigned_user.id],
          'feeding-incomplete-alert',
          `The ${feeding.shift_type} feeding for today has not been marked complete.`,
          {
            type: 'feeding-incomplete',
            feedingId: feeding.id,
            shiftType: feeding.shift_type,
          },
        );
      } else {
        const todayStable = getLocalDateString(nowUtc, stableTz);

        if (
          !isLocalHour(nowUtc, stableTz, targetHour) ||
          scheduleDate !== todayStable
        ) {
          continue;
        }

        if (fallbackRecipientIds.length === 0) {
          continue;
        }

        await this.feedingNotifications.notifyUsers(
          fallbackRecipientIds,
          'feeding-incomplete-alert',
          `The ${feeding.shift_type} feeding for today has not been marked complete.`,
          {
            type: 'feeding-incomplete',
            feedingId: feeding.id,
            shiftType: feeding.shift_type,
          },
        );
      }

      feeding.incomplete_alert_sent_at = nowUtc.toJSDate();
      await this.feedingRepository.save(feeding);
      sentCount += 1;
    }

    if (sentCount > 0) {
      this.logger.log(`Sent incomplete feeding alerts for ${sentCount} feeding(s)`);
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

      const assigneeTz = resolveUserTimezone(task.assigned_user.timezone);
      if (!isLocalHour(nowUtc, assigneeTz, 22)) {
        continue;
      }

      const tomorrowLocal = addDaysToDateStr(
        getLocalDateString(nowUtc, assigneeTz),
        1,
      );
      const deadlineDate = formatScheduleDate(task.deadline);

      if (deadlineDate !== tomorrowLocal) {
        continue;
      }

      await this.notificationQueue.add('task-deadline-reminder', {
        userId: task.assigned_user.id,
        message: `Reminder: "${task.name}" is due tomorrow.`,
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
