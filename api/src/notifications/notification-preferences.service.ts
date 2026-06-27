import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

export type NotificationPreferenceKey =
  | 'notify_feeding_reminders'
  | 'notify_shift_reassigned'
  | 'notify_unassigned_feeding'
  | 'notify_feeding_incomplete_assignee'
  | 'notify_feeding_incomplete_broadcast'
  | 'notify_task_deadlines'
  | 'notify_role_requests'
  | 'notify_role_request_resolved'
  | 'notify_event_modified';

export const NOTIFICATION_JOB_PREFERENCE: Record<string, NotificationPreferenceKey> = {
  'feeding-reminder': 'notify_feeding_reminders',
  'shift-reassigned-alert': 'notify_shift_reassigned',
  'unassigned-night-alert': 'notify_unassigned_feeding',
  'feeding-incomplete-assignee-alert': 'notify_feeding_incomplete_assignee',
  'feeding-incomplete-broadcast-alert': 'notify_feeding_incomplete_broadcast',
  'task-deadline-reminder': 'notify_task_deadlines',
  'role-request-alert': 'notify_role_requests',
  'role-request-resolved': 'notify_role_request_resolved',
  'event-modified-alert': 'notify_event_modified',
  'ride-joined-alert': 'notify_event_modified',
};

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async filterEligibleUserIds(
    userIds: string[],
    jobName: string,
  ): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }

    const preferenceKey = NOTIFICATION_JOB_PREFERENCE[jobName];
    if (!preferenceKey) {
      return userIds;
    }

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      select: {
        id: true,
        push_notifications_enabled: true,
        notify_feeding_reminders: true,
        notify_shift_reassigned: true,
        notify_unassigned_feeding: true,
        notify_feeding_incomplete_assignee: true,
        notify_feeding_incomplete_broadcast: true,
        notify_task_deadlines: true,
        notify_role_requests: true,
        notify_role_request_resolved: true,
        notify_event_modified: true,
      },
    });

    const userById = new Map(users.map((user) => [user.id, user]));

    return userIds.filter((userId) => {
      const user = userById.get(userId);
      if (!user) {
        return false;
      }
      if (!user.push_notifications_enabled) {
        return false;
      }
      return user[preferenceKey];
    });
  }

  async isUserEligible(userId: string, jobName: string): Promise<boolean> {
    const eligible = await this.filterEligibleUserIds([userId], jobName);
    return eligible.length > 0;
  }
}
