import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DateTime } from 'luxon';
import { Feeding, ShiftType } from '../feedings/entities/feeding.entity';
import { User } from '../users/entities/user.entity';
import {
  DEFAULT_STABLE_TIMEZONE,
  formatScheduleDate,
  localTimeOnDateToUtc,
  resolveUserTimezone,
} from '../common/timezone.util';

function feedingReminderJobId(feedingId: string): string {
  return `feeding-reminder-${feedingId}`;
}

@Injectable()
export class FeedingNotificationsService {
  private readonly logger = new Logger(FeedingNotificationsService.name);

  constructor(
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
  ) {}

  async notifyAssigneeChange(
    previousUserId: string,
    newUser: User,
    shift: Feeding,
  ): Promise<void> {
    await this.notificationQueue.add('shift-reassigned-alert', {
      userId: previousUserId,
      shiftType: shift.shift_type,
      message: `Heads up! ${newUser.name} covered your ${shift.shift_type} feeding shift on ${formatScheduleDate(shift.schedule_date)}.`,
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

    const nowUtc = DateTime.utc();
    let alertUtc: DateTime;

    if (customNotificationTime) {
      alertUtc = DateTime.fromISO(customNotificationTime, { zone: 'utc' });
      if (!alertUtc.isValid) {
        throw new Error('Invalid custom notification time; expected ISO-8601 UTC.');
      }
    } else {
      const preferredTime =
        feeding.shift_type === ShiftType.MORNING
          ? assignee.morning_alert_time
          : assignee.evening_alert_time;
      alertUtc = localTimeOnDateToUtc(
        formatScheduleDate(feeding.schedule_date),
        preferredTime,
        resolveUserTimezone(assignee.timezone),
      );
    }

    const computedDelay = Math.max(0, alertUtc.toMillis() - nowUtc.toMillis());

    await this.notificationQueue.add(
      'feeding-reminder',
      {
        userId: assignee.id,
        shiftType: feeding.shift_type,
        message: `Reminder: You have the ${feeding.shift_type} feeding shift coming up!`,
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

  async notifyUsers(
    userIds: string[],
    jobName: string,
    message: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    for (const userId of userIds) {
      await this.notificationQueue.add(jobName, {
        userId,
        message,
        data,
      });
    }
  }
}
