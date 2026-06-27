import { Injectable } from '@nestjs/common';
import { Feeding } from '../feedings/entities/feeding.entity';
import { Ride } from '../rides/entities/ride.entity';
import { Task } from '../tasks/entities/task.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { AuthUser, EventKind } from '../common/event-permissions';
import {
  eventModifiedMessage,
  rideJoinedMessage,
} from './notification-messages';
import { FeedingNotificationsService } from './feeding-notifications.service';

export function getEventStakeholderIds(
  eventKind: EventKind,
  entity: Feeding | Task | Ride | Treatment,
): string[] {
  switch (eventKind) {
    case 'ride': {
      const ride = entity as Ride;
      const ids = new Set<string>();
      if (ride.primary_rider?.id) {
        ids.add(ride.primary_rider.id);
      }
      for (const rider of ride.additional_riders ?? []) {
        if (rider.id) {
          ids.add(rider.id);
        }
      }
      return [...ids];
    }
    case 'feeding': {
      const feeding = entity as Feeding;
      return feeding.assigned_user?.id ? [feeding.assigned_user.id] : [];
    }
    case 'task': {
      const task = entity as Task;
      return task.assigned_user?.id ? [task.assigned_user.id] : [];
    }
    case 'treatment': {
      const treatment = entity as Treatment;
      return treatment.user?.id ? [treatment.user.id] : [];
    }
    default:
      return [];
  }
}

function isRideParticipant(ride: Ride, userId: string): boolean {
  if (ride.primary_rider?.id === userId) {
    return true;
  }
  return ride.additional_riders?.some((rider) => rider.id === userId) ?? false;
}

export function detectRideJoin(
  existing: Ride,
  saved: Ride,
  editorUserId: string,
): boolean {
  const wasParticipant = isRideParticipant(existing, editorUserId);
  const isNowAdditional =
    saved.additional_riders?.some((rider) => rider.id === editorUserId) ?? false;
  return !wasParticipant && isNowAdditional;
}

@Injectable()
export class EventNotificationsService {
  constructor(private readonly feedingNotifications: FeedingNotificationsService) {}

  async notifyEventModified(
    editor: AuthUser,
    eventKind: EventKind,
    entity: Feeding | Task | Ride | Treatment,
    options?: { excludeUserIds?: string[] },
  ): Promise<void> {
    const allStakeholders = getEventStakeholderIds(eventKind, entity);
    if (allStakeholders.includes(editor.userId)) {
      return;
    }

    const exclude = new Set(options?.excludeUserIds ?? []);
    const stakeholders = allStakeholders.filter((userId) => !exclude.has(userId));

    if (stakeholders.length === 0) {
      return;
    }

    const eventDate = this.getEventDate(eventKind, entity);
    const message = eventModifiedMessage(editor.name, eventKind, eventDate);

    await this.feedingNotifications.notifyUsers(
      stakeholders,
      'event-modified-alert',
      message,
      {
        type: 'event-modified',
        eventKind,
        eventId: entity.id,
      },
    );
  }

  async notifyRideJoined(
    editor: AuthUser,
    ride: Ride,
  ): Promise<void> {
    const primaryRiderId = ride.primary_rider?.id;
    if (!primaryRiderId || primaryRiderId === editor.userId) {
      return;
    }

    const message = rideJoinedMessage(editor.name, ride.date);

    await this.feedingNotifications.notifyUsers(
      [primaryRiderId],
      'ride-joined-alert',
      message,
      {
        type: 'ride-joined',
        eventKind: 'ride',
        eventId: ride.id,
        rideId: ride.id,
      },
    );
  }

  private getEventDate(
    eventKind: EventKind,
    entity: Feeding | Task | Ride | Treatment,
  ): Date | string {
    switch (eventKind) {
      case 'ride':
        return (entity as Ride).date;
      case 'feeding':
        return (entity as Feeding).schedule_date;
      case 'task': {
        const task = entity as Task;
        return task.deadline ?? new Date();
      }
      case 'treatment':
        return (entity as Treatment).date;
      default:
        return new Date();
    }
  }
}
