import { Injectable } from '@nestjs/common';
import { Feeding } from '../feedings/entities/feeding.entity';
import { Ride } from '../rides/entities/ride.entity';
import { Task } from '../tasks/entities/task.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { AuthUser, EventKind } from '../common/event-permissions';
import {
  eventModifiedMessage,
  getEventScheduleDateString,
  rideJoinedMessage,
  rideRemovedMessage,
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

export function getRemovedRideParticipantIds(existing: Ride, saved: Ride): string[] {
  const before = new Set(getEventStakeholderIds('ride', existing));
  const after = new Set(getEventStakeholderIds('ride', saved));
  return [...before].filter((userId) => !after.has(userId));
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
    const exclude = new Set([editor.userId, ...(options?.excludeUserIds ?? [])]);
    const stakeholders = allStakeholders.filter((userId) => !exclude.has(userId));

    if (stakeholders.length === 0) {
      return;
    }

    const message = eventModifiedMessage(editor.name, eventKind, entity);
    const scheduleDate = getEventScheduleDateString(eventKind, entity);

    await this.feedingNotifications.notifyUsers(
      stakeholders,
      'event-modified-alert',
      message,
      {
        type: 'event-modified',
        eventKind,
        eventId: entity.id,
        ...(scheduleDate ? { scheduleDate } : {}),
      },
    );
  }

  async notifyRideUpdated(
    editor: AuthUser,
    existing: Ride,
    saved: Ride,
  ): Promise<void> {
    const removedParticipantIds = getRemovedRideParticipantIds(existing, saved).filter(
      (userId) => userId !== editor.userId,
    );

    if (removedParticipantIds.length > 0) {
      const message = rideRemovedMessage(editor.name, saved.date);
      const scheduleDate = getEventScheduleDateString('ride', saved);

      await this.feedingNotifications.notifyUsers(
        removedParticipantIds,
        'event-modified-alert',
        message,
        {
          type: 'ride-removed',
          eventKind: 'ride',
          eventId: saved.id,
          ...(scheduleDate ? { scheduleDate } : {}),
        },
      );
    }

    const joined = detectRideJoin(existing, saved, editor.userId);

    if (joined) {
      await this.notifyRideJoined(editor, saved);
      await this.notifyEventModified(editor, 'ride', saved, {
        excludeUserIds: [
          editor.userId,
          ...(saved.primary_rider?.id ? [saved.primary_rider.id] : []),
          ...removedParticipantIds,
        ],
      });
      return;
    }

    await this.notifyEventModified(editor, 'ride', saved, {
      excludeUserIds: [editor.userId, ...removedParticipantIds],
    });
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
}
