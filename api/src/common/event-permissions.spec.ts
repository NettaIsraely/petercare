import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  assertAssignableUser,
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

  it('blocks caregivers from editing feedings assigned to others', () => {
    const feeding = {
      feeding_status: 'ASSIGNED',
      assigned_user: { id: 'other-id' },
      shift_type: 'MORNING',
    } as any;

    expect(() => assertCanEditEvent(caregiver, 'feeding', feeding)).toThrow(ForbiddenException);
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
});
