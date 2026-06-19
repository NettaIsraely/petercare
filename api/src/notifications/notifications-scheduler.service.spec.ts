import { DateTime } from 'luxon';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { FeedingNotificationsService } from './feeding-notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import {
  Feeding,
  FeedingStatus,
  ShiftType,
} from '../feedings/entities/feeding.entity';
import { Task } from '../tasks/entities/task.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('NotificationsSchedulerService incomplete alerts', () => {
  let service: NotificationsSchedulerService;
  let feedingRepository: {
    find: jest.Mock;
    save: jest.Mock;
  };
  let notifyUsers: jest.Mock;

  beforeEach(async () => {
    feedingRepository = {
      find: jest.fn(),
      save: jest.fn(async (feeding: Feeding) => feeding),
    };
    notifyUsers = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsSchedulerService,
        {
          provide: getRepositoryToken(Feeding),
          useValue: feedingRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn().mockResolvedValue([
              { id: 'owner-1', role: UserRole.OWNER },
            ]),
          },
        },
        {
          provide: FeedingNotificationsService,
          useValue: { notifyUsers },
        },
        {
          provide: NotificationPreferencesService,
          useValue: {
            filterEligibleUserIds: jest.fn(async (ids: string[]) => ids),
          },
        },
        {
          provide: getQueueToken('notifications'),
          useValue: { add: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'Asia/Jerusalem') },
        },
      ],
    }).compile();

    service = module.get(NotificationsSchedulerService);
  });

  it('sends assignee prompt at 9:00 stable time for morning shift', async () => {
    const nowUtc = DateTime.fromISO('2026-06-19T06:00:00.000Z', { zone: 'utc' });
    feedingRepository.find.mockResolvedValueOnce([
      {
        id: 'feeding-1',
        schedule_date: '2026-06-19',
        shift_type: ShiftType.MORNING,
        feeding_status: FeedingStatus.ASSIGNED,
        assigned_user: { id: 'assignee-1', name: 'Jane Smith' },
        incomplete_assignee_alert_sent_at: null,
      },
    ]);

    await (service as unknown as { processIncompleteAssigneeAlerts: (now: DateTime) => Promise<void> })
      .processIncompleteAssigneeAlerts(nowUtc);

    expect(notifyUsers).toHaveBeenCalledWith(
      ['assignee-1'],
      'feeding-incomplete-assignee-alert',
      expect.stringContaining("today's Morning feeding"),
      expect.objectContaining({ type: 'feeding-incomplete-assignee' }),
    );
  });

  it('sends broadcast at 10:00 stable time with assignee name', async () => {
    const nowUtc = DateTime.fromISO('2026-06-19T07:00:00.000Z', { zone: 'utc' });
    feedingRepository.find.mockResolvedValueOnce([
      {
        id: 'feeding-1',
        schedule_date: '2026-06-19',
        shift_type: ShiftType.MORNING,
        feeding_status: FeedingStatus.ASSIGNED,
        assigned_user: { id: 'assignee-1', name: 'Jane Smith' },
        incomplete_broadcast_alert_sent_at: null,
      },
    ]);

    await (service as unknown as { processIncompleteBroadcastAlerts: (now: DateTime) => Promise<void> })
      .processIncompleteBroadcastAlerts(nowUtc);

    expect(notifyUsers).toHaveBeenCalledWith(
      ['owner-1'],
      'feeding-incomplete-broadcast-alert',
      expect.stringContaining('Assigned to: Jane Smith'),
      expect.objectContaining({ type: 'feeding-incomplete-broadcast' }),
    );
  });

  it('sends evening broadcast at 20:30 stable time', async () => {
    const nowUtc = DateTime.fromISO('2026-06-19T17:30:00.000Z', { zone: 'utc' });
    feedingRepository.find.mockResolvedValueOnce([
      {
        id: 'feeding-2',
        schedule_date: '2026-06-19',
        shift_type: ShiftType.EVENING,
        feeding_status: FeedingStatus.UNASSIGNED,
        assigned_user: null,
        incomplete_broadcast_alert_sent_at: null,
      },
    ]);

    await (service as unknown as { processIncompleteBroadcastAlerts: (now: DateTime) => Promise<void> })
      .processIncompleteBroadcastAlerts(nowUtc);

    expect(notifyUsers).toHaveBeenCalledWith(
      ['owner-1'],
      'feeding-incomplete-broadcast-alert',
      expect.stringContaining('still unassigned'),
      expect.objectContaining({ type: 'feeding-incomplete-broadcast' }),
    );
  });
});
