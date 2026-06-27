import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { DateTime } from 'luxon';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Feeding, FeedingStatus, ShiftType } from '../feedings/entities/feeding.entity';
import { User } from '../users/entities/user.entity';
import {
  DEFAULT_STABLE_TIMEZONE,
  formatScheduleDate,
  getLocalDateString,
  getStableTimezone,
  localTimeOnDateToUtc,
} from '../common/timezone.util';
import {
  feedingReminderMessage,
  shiftReassignedMessage,
} from './notification-messages';
import { NotificationPreferencesService } from './notification-preferences.service';

function feedingReminderJobId(feedingId: string): string {
  return `feeding-reminder-${feedingId}`;
}

const TIME_ONLY_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

function isTimeOnlyString(value: string): boolean {
  return TIME_ONLY_PATTERN.test(value.trim());
}

export function resolveFeedingAlertUtc(
  feeding: Pick<Feeding, 'schedule_date' | 'shift_type'>,
  assignee: Pick<User, 'morning_alert_time' | 'evening_alert_time'>,
  customNotificationTime?: string,
  stableTimezone: string = DEFAULT_STABLE_TIMEZONE,
): DateTime {
  const scheduleDate = formatScheduleDate(feeding.schedule_date);
  const timezone = stableTimezone;

  if (customNotificationTime) {
    if (isTimeOnlyString(customNotificationTime)) {
      return localTimeOnDateToUtc(scheduleDate, customNotificationTime, timezone);
    }

    const alertUtc = DateTime.fromISO(customNotificationTime, { zone: 'utc' });
    if (!alertUtc.isValid) {
      throw new Error('Invalid custom notification time; expected HH:MM:SS or ISO-8601 UTC.');
    }
    return alertUtc;
  }

  const preferredTime =
    feeding.shift_type === ShiftType.MORNING
      ? assignee.morning_alert_time
      : assignee.evening_alert_time;

  return localTimeOnDateToUtc(scheduleDate, preferredTime, timezone);
}

@Injectable()
export class FeedingNotificationsService {
  private readonly logger = new Logger(FeedingNotificationsService.name);

  constructor(
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
    private readonly notificationPreferences: NotificationPreferencesService,
    @InjectRepository(Feeding)
    private readonly feedingRepository: Repository<Feeding>,
    private readonly configService: ConfigService,
  ) {}

  async notifyAssigneeChange(
    previousUserId: string,
    newUser: User,
    shift: Feeding,
  ): Promise<void> {
    const eligibleIds = await this.notificationPreferences.filterEligibleUserIds(
      [previousUserId],
      'shift-reassigned-alert',
    );

    if (eligibleIds.length === 0) {
      return;
    }

    await this.notificationQueue.add('shift-reassigned-alert', {
      userId: previousUserId,
      shiftType: shift.shift_type,
      message: shiftReassignedMessage(newUser.name, shift.shift_type, shift.schedule_date),
      data: {
        type: 'feeding-reassigned',
        feedingId: shift.id,
        shiftType: shift.shift_type,
      },
    });
  }

  async scheduleFeedingReminder(
    feeding: Feeding,
    assignee: User,
    customNotificationTime?: string,
  ): Promise<void> {
    await this.cancelFeedingReminder(feeding.id);

    const eligible = await this.notificationPreferences.isUserEligible(
      assignee.id,
      'feeding-reminder',
    );
    if (!eligible) {
      return;
    }

    const nowUtc = DateTime.utc();
    const stableTz = getStableTimezone(this.configService);
    const alertUtc = resolveFeedingAlertUtc(
      feeding,
      assignee,
      customNotificationTime,
      stableTz,
    );
    const computedDelay = Math.max(0, alertUtc.toMillis() - nowUtc.toMillis());

    this.logger.debug(
      `Scheduled feeding reminder: feedingId=${feeding.id} scheduleDate=${formatScheduleDate(feeding.schedule_date)} alertUtc=${alertUtc.toISO()} delayMs=${computedDelay}`,
    );

    await this.notificationQueue.add(
      'feeding-reminder',
      {
        userId: assignee.id,
        shiftType: feeding.shift_type,
        message: feedingReminderMessage(feeding.shift_type),
        data: {
          type: 'feeding-reminder',
          feedingId: feeding.id,
          shiftType: feeding.shift_type,
        },
      },
      {
        delay: computedDelay,
        jobId: feedingReminderJobId(feeding.id),
      },
    );
  }

  async cancelFeedingReminder(feedingId: string): Promise<void> {
    const job = await this.notificationQueue.getJob(feedingReminderJobId(feedingId));
    if (job) {
      await job.remove();
      this.logger.debug(`Cancelled feeding reminder job for feeding ${feedingId}`);
    }
  }

  async rescheduleFeedingRemindersForUser(user: User): Promise<void> {
    const stableTz = getStableTimezone(this.configService);
    const todayLocalDate = getLocalDateString(DateTime.utc(), stableTz);

    const feedings = await this.feedingRepository.find({
      where: {
        assigned_user: { id: user.id },
        feeding_status: FeedingStatus.ASSIGNED,
        schedule_date: MoreThanOrEqual(todayLocalDate as unknown as Date),
      },
    });

    for (const feeding of feedings) {
      await this.scheduleFeedingReminder(feeding, user);
    }

    if (feedings.length > 0) {
      this.logger.log(
        `Rescheduled ${feedings.length} feeding reminder(s) for user ${user.id}`,
      );
    }
  }

  async notifyUsers(
    userIds: string[],
    jobName: string,
    message: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const eligibleIds = await this.notificationPreferences.filterEligibleUserIds(
      userIds,
      jobName,
    );

    for (const userId of eligibleIds) {
      await this.notificationQueue.add(jobName, {
        userId,
        message,
        data,
      });
    }
  }
}

