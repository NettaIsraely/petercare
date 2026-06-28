import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  assertAssignableUser,
  assertCanCompleteEvent,
  assertCanDeleteEvent,
  assertCanEditEvent,
  assertCanTakeOverFeeding,
  assertGuestCannotMutate,
  assertOwnerOnly,
  AuthUser,
  pickFeedingUpdateFields,
} from './event-permissions';
import { UserRole } from '../users/entities/user.entity';

const owner: AuthUser = { userId: 'owner-id', name: 'Owner', role: UserRole.OWNER };
const caregiver: AuthUser = {
  userId: 'caregiver-id',
  name: 'Caregiver',
  role: UserRole.CAREGIVER,
};
const guest: AuthUser = { userId: 'guest-id', name: 'Guest', role: UserRole.GUEST };

describe('event-permissions', () => {
  it('blocks guest mutations', () => {
    expect(() => assertGuestCannotMutate(guest)).toThrow(ForbiddenException);
  });

  it('allows owner-only actions for owners', () => {
    expect(() => assertOwnerOnly(owner)).not.toThrow();
    expect(() => assertOwnerOnly(caregiver)).toThrow(ForbiddenException);
  });

  it('allows caregivers to edit unassigned feedings', () => {
    const feeding = {
      feeding_status: 'UNASSIGNED',
      shift_type: 'MORNING',
    } as any;

    expect(() => assertCanEditEvent(caregiver, 'feeding', feeding)).not.toThrow();
  });

  it('allows caregivers to edit feedings assigned to others', () => {
    const feeding = {
      feeding_status: 'ASSIGNED',
      assigned_user: { id: 'other-id' },
      shift_type: 'MORNING',
    } as any;

    expect(() => assertCanEditEvent(caregiver, 'feeding', feeding)).not.toThrow();
  });

  it('allows caregivers to edit rides, tasks, and treatments assigned to others', () => {
    const ride = {
      primary_rider: { id: 'other-id' },
      additional_riders: [],
    } as any;
    const task = { assigned_user: { id: 'other-id' } } as any;
    const treatment = { user: { id: 'other-id' } } as any;

    expect(() => assertCanEditEvent(caregiver, 'ride', ride)).not.toThrow();
    expect(() => assertCanEditEvent(caregiver, 'task', task)).not.toThrow();
    expect(() => assertCanEditEvent(caregiver, 'treatment', treatment)).not.toThrow();
  });

  it('blocks feeding deletes for all roles', () => {
    expect(() => assertCanDeleteEvent(owner, 'feeding')).toThrow(BadRequestException);
    expect(() => assertCanDeleteEvent(caregiver, 'feeding')).toThrow(BadRequestException);
  });

  it('allows owner and caregiver to delete rides, tasks, and treatments', () => {
    expect(() => assertCanDeleteEvent(owner, 'ride')).not.toThrow();
    expect(() => assertCanDeleteEvent(caregiver, 'task')).not.toThrow();
    expect(() => assertCanDeleteEvent(caregiver, 'treatment')).not.toThrow();
  });

  it('blocks guests from deleting events', () => {
    expect(() => assertCanDeleteEvent(guest, 'ride')).toThrow(ForbiddenException);
  });

  it('whitelists feeding update fields', () => {
    const picked = pickFeedingUpdateFields({
      assigned_user_id: 'user-1',
      notification_time: '08:00:00',
      schedule_date: '2026-01-01',
      shift_type: 'EVENING',
      feeding_status: 'COMPLETE',
    });

    expect(picked).toEqual({
      assigned_user_id: 'user-1',
      notification_time: '08:00:00',
      feeding_status: 'COMPLETE',
    });
  });

  it('allows owner and caregiver to take over feedings assigned to others', () => {
    const feeding = {
      feeding_status: 'ASSIGNED',
      assigned_user: { id: 'other-id' },
      shift_type: 'MORNING',
    } as any;

    expect(() => assertCanTakeOverFeeding(owner, feeding)).not.toThrow();
    expect(() => assertCanTakeOverFeeding(caregiver, feeding)).not.toThrow();
  });

  it('blocks take over for guests, unassigned, own shift, and complete feedings', () => {
    const assignedToOther = {
      feeding_status: 'ASSIGNED',
      assigned_user: { id: 'other-id' },
    } as any;

    expect(() => assertCanTakeOverFeeding(guest, assignedToOther)).toThrow(ForbiddenException);

    expect(() =>
      assertCanTakeOverFeeding(caregiver, {
        feeding_status: 'UNASSIGNED',
      } as any),
    ).toThrow(BadRequestException);

    expect(() =>
      assertCanTakeOverFeeding(caregiver, {
        feeding_status: 'ASSIGNED',
        assigned_user: { id: caregiver.userId },
      } as any),
    ).toThrow(BadRequestException);

    expect(() =>
      assertCanTakeOverFeeding(caregiver, {
        feeding_status: 'COMPLETE',
        assigned_user: { id: 'other-id' },
      } as any),
    ).toThrow(ForbiddenException);
  });

  it('allows null assignee checks to pass', async () => {
    const userRepo = { findOne: jest.fn() } as any;
    await expect(assertAssignableUser(userRepo, null)).resolves.toBeUndefined();
    expect(userRepo.findOne).not.toHaveBeenCalled();
  });

  it('rejects guest assignees', async () => {
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'guest-id', role: UserRole.GUEST }),
    } as any;

    await expect(assertAssignableUser(userRepo, 'guest-id')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('allows owner and caregiver assignees', async () => {
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'caregiver-id', role: UserRole.CAREGIVER }),
    } as any;

    await expect(assertAssignableUser(userRepo, 'caregiver-id')).resolves.toBeUndefined();
  });

  it('allows caregivers to complete tasks and treatments assigned to others', () => {
    const task = { assigned_user: { id: 'other-id' } } as any;
    const treatment = { user: { id: 'other-id' } } as any;

    expect(() => assertCanCompleteEvent(caregiver, 'task', task)).not.toThrow();
    expect(() => assertCanCompleteEvent(caregiver, 'treatment', treatment)).not.toThrow();
  });

  it('allows caregivers to complete feedings assigned to others', () => {
    const feeding = {
      feeding_status: 'ASSIGNED',
      assigned_user: { id: 'other-id' },
    } as any;

    expect(() => assertCanCompleteEvent(caregiver, 'feeding', feeding)).not.toThrow();
  });

  it('blocks completing unassigned feedings for owners and caregivers', () => {
    const unassigned = {
      feeding_status: 'UNASSIGNED',
      assigned_user: null,
    } as any;

    expect(() => assertCanCompleteEvent(owner, 'feeding', unassigned)).toThrow(
      ForbiddenException,
    );
    expect(() => assertCanCompleteEvent(caregiver, 'feeding', unassigned)).toThrow(
      ForbiddenException,
    );
  });

  it('blocks guests from completing events', () => {
    const task = { assigned_user: { id: 'other-id' } } as any;

    expect(() => assertCanCompleteEvent(guest, 'task', task)).toThrow(ForbiddenException);
  });
});
