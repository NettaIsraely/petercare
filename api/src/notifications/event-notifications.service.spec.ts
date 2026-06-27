import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../users/entities/user.entity';
import { AuthUser } from '../common/event-permissions';
import { Ride } from '../rides/entities/ride.entity';
import { Task } from '../tasks/entities/task.entity';
import { FeedingNotificationsService } from './feeding-notifications.service';
import {
  EventNotificationsService,
  getEventStakeholderIds,
} from './event-notifications.service';

describe('EventNotificationsService', () => {
  let service: EventNotificationsService;
  let notifyUsers: jest.Mock;

  const editor: AuthUser = {
    userId: 'editor-1',
    name: 'Alex',
    role: UserRole.CAREGIVER,
  };

  beforeEach(async () => {
    notifyUsers = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventNotificationsService,
        {
          provide: FeedingNotificationsService,
          useValue: { notifyUsers },
        },
      ],
    }).compile();

    service = module.get(EventNotificationsService);
  });

  function makeRide(overrides: Partial<Ride> = {}): Ride {
    return {
      id: 'ride-1',
      primary_rider: { id: 'primary-1' },
      additional_riders: [{ id: 'additional-1' }, { id: 'additional-2' }],
      date: '2026-06-20',
      ...overrides,
    } as Ride;
  }

  it('notifies stakeholders except the editor', async () => {
    const ride = makeRide();

    await service.notifyEventModified(
      { ...editor, userId: 'owner-1' },
      'ride',
      ride,
    );

    expect(notifyUsers).toHaveBeenCalledWith(
      ['primary-1', 'additional-1', 'additional-2'],
      'event-modified-alert',
      'Alex made changes to this event.',
      {
        type: 'event-modified',
        eventKind: 'ride',
        eventId: 'ride-1',
      },
    );
  });

  it('notifies additional riders when primary rider edits', async () => {
    const ride = makeRide();

    await service.notifyEventModified(
      { ...editor, userId: 'primary-1' },
      'ride',
      ride,
    );

    expect(notifyUsers).toHaveBeenCalledWith(
      ['additional-1', 'additional-2'],
      'event-modified-alert',
      'Alex made changes to this event.',
      expect.objectContaining({ eventKind: 'ride', eventId: 'ride-1' }),
    );
  });

  it('notifies primary and other additional riders when one additional rider edits', async () => {
    const ride = makeRide();

    await service.notifyEventModified(
      { ...editor, userId: 'additional-1' },
      'ride',
      ride,
    );

    expect(notifyUsers).toHaveBeenCalledWith(
      ['primary-1', 'additional-2'],
      'event-modified-alert',
      'Alex made changes to this event.',
      expect.objectContaining({ eventKind: 'ride', eventId: 'ride-1' }),
    );
  });

  it('does not notify when editor is the only stakeholder', async () => {
    const task = {
      id: 'task-1',
      assigned_user: { id: 'editor-1' },
    } as Task;

    await service.notifyEventModified(editor, 'task', task);

    expect(notifyUsers).not.toHaveBeenCalled();
  });

  it('respects excludeUserIds for feeding reassignment', async () => {
    const task = {
      id: 'task-1',
      assigned_user: { id: 'assignee-1' },
    } as Task;

    await service.notifyEventModified(editor, 'task', task, {
      excludeUserIds: ['assignee-1'],
    });

    expect(notifyUsers).not.toHaveBeenCalled();
  });

  it('notifies assignee when editor is different user', async () => {
    const task = {
      id: 'task-1',
      assigned_user: { id: 'assignee-1' },
    } as Task;

    await service.notifyEventModified(editor, 'task', task);

    expect(notifyUsers).toHaveBeenCalledWith(
      ['assignee-1'],
      'event-modified-alert',
      'Alex made changes to this event.',
      expect.objectContaining({ eventKind: 'task', eventId: 'task-1' }),
    );
  });
});

describe('getEventStakeholderIds', () => {
  it('returns primary and additional riders for rides', () => {
    const ride = {
      primary_rider: { id: 'primary-1' },
      additional_riders: [{ id: 'additional-1' }, { id: 'additional-2' }],
    } as Ride;

    expect(getEventStakeholderIds('ride', ride)).toEqual([
      'primary-1',
      'additional-1',
      'additional-2',
    ]);
  });
});
