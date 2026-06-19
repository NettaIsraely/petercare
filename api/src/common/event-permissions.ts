import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Feeding, FeedingStatus } from '../feedings/entities/feeding.entity';
import { Ride } from '../rides/entities/ride.entity';
import { Task } from '../tasks/entities/task.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { User, UserRole } from '../users/entities/user.entity';

export interface AuthUser {
  userId: string;
  name: string;
  role: UserRole;
}

export type EventKind = 'feeding' | 'task' | 'ride' | 'treatment';

export function assertGuestCannotMutate(user: AuthUser): void {
  if (user.role === UserRole.GUEST) {
    throw new ForbiddenException('Guests cannot modify events');
  }
}

export function assertOwnerOnly(user: AuthUser): void {
  if (user.role !== UserRole.OWNER) {
    throw new ForbiddenException('Only owners can perform this action');
  }
}

export async function assertAssignableUser(
  userRepo: Repository<User>,
  userId: string | null | undefined,
): Promise<void> {
  if (!userId) {
    return;
  }

  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user || user.role === UserRole.GUEST) {
    throw new BadRequestException('Assignee must be an owner or caregiver.');
  }
}

export async function assertAssignableUsers(
  userRepo: Repository<User>,
  userIds: Array<string | null | undefined> | null | undefined,
): Promise<void> {
  if (!userIds?.length) {
    return;
  }

  for (const userId of userIds) {
    await assertAssignableUser(userRepo, userId);
  }
}

export function assertCanEditEvent(
  user: AuthUser,
  eventKind: EventKind,
  entity: Feeding | Task | Ride | Treatment,
): void {
  assertGuestCannotMutate(user);

  if (user.role === UserRole.OWNER) {
    return;
  }

  if (user.role !== UserRole.CAREGIVER) {
    throw new ForbiddenException('You do not have permission to edit this event');
  }

  switch (eventKind) {
    case 'feeding': {
      const feeding = entity as Feeding;
      const isUnassigned = feeding.feeding_status === FeedingStatus.UNASSIGNED;
      const isMine = feeding.assigned_user?.id === user.userId;
      if (!isUnassigned && !isMine) {
        throw new ForbiddenException('You can only edit unassigned feedings or feedings assigned to you');
      }
      return;
    }
    case 'task': {
      const task = entity as Task;
      const isUnassigned = !task.assigned_user?.id;
      const isMine = task.assigned_user?.id === user.userId;
      if (!isUnassigned && !isMine) {
        throw new ForbiddenException('You can only edit unassigned tasks or tasks assigned to you');
      }
      return;
    }
    case 'ride': {
      const ride = entity as Ride;
      const isPrimary = ride.primary_rider?.id === user.userId;
      const isAdditional = ride.additional_riders?.some((r) => r.id === user.userId);
      if (!isPrimary && !isAdditional) {
        throw new ForbiddenException('You can only edit rides where you are a rider');
      }
      return;
    }
    case 'treatment': {
      const treatment = entity as Treatment;
      if (treatment.user?.id !== user.userId) {
        throw new ForbiddenException('You can only edit treatments assigned to you');
      }
      return;
    }
  }
}

export function assertCanVolunteerFeeding(user: AuthUser, feeding: Feeding): void {
  assertGuestCannotMutate(user);
  assertCanEditEvent(user, 'feeding', feeding);
}

export function assertCanTakeOverFeeding(user: AuthUser, feeding: Feeding): void {
  assertGuestCannotMutate(user);

  if (user.role !== UserRole.OWNER && user.role !== UserRole.CAREGIVER) {
    throw new ForbiddenException('You do not have permission to take over this feeding shift');
  }

  if (feeding.feeding_status === FeedingStatus.COMPLETE) {
    throw new ForbiddenException('Completed feeding shifts cannot be taken over');
  }

  if (
    feeding.feeding_status === FeedingStatus.UNASSIGNED ||
    !feeding.assigned_user?.id
  ) {
    throw new BadRequestException('This feeding shift is not assigned to anyone');
  }

  if (feeding.assigned_user.id === user.userId) {
    throw new BadRequestException('This feeding shift is already assigned to you');
  }
}

export function assertCanClaimTask(user: AuthUser, task: Task): void {
  assertGuestCannotMutate(user);
  if (!task.assigned_user?.id) {
    return;
  }
  throw new ForbiddenException('This task is already assigned');
}

export function assertCanCompleteEvent(
  user: AuthUser,
  eventKind: EventKind,
  entity: Feeding | Task | Treatment,
): void {
  assertGuestCannotMutate(user);

  if (user.role === UserRole.OWNER) {
    return;
  }

  switch (eventKind) {
    case 'feeding': {
      const feeding = entity as Feeding;
      if (feeding.assigned_user?.id !== user.userId) {
        throw new ForbiddenException('You can only complete feedings assigned to you');
      }
      return;
    }
    case 'task': {
      const task = entity as Task;
      if (task.assigned_user?.id !== user.userId) {
        throw new ForbiddenException('You can only complete tasks assigned to you');
      }
      return;
    }
    case 'treatment': {
      const treatment = entity as Treatment;
      if (treatment.user?.id !== user.userId) {
        throw new ForbiddenException('You can only complete treatments assigned to you');
      }
      return;
    }
    default:
      throw new ForbiddenException('This event type cannot be marked complete');
  }
}

export function pickFeedingUpdateFields(
  dto: Record<string, unknown>,
): Record<string, unknown> {
  const allowed: Record<string, unknown> = {};
  if (dto.assigned_user_id !== undefined) {
    allowed.assigned_user_id = dto.assigned_user_id;
  }
  if (dto.notification_time !== undefined) {
    allowed.notification_time = dto.notification_time;
  }
  if (dto.feeding_status === FeedingStatus.COMPLETE) {
    allowed.feeding_status = FeedingStatus.COMPLETE;
  }
  if (dto.feeding_status === FeedingStatus.ASSIGNED) {
    allowed.feeding_status = FeedingStatus.ASSIGNED;
  }
  return allowed;
}
