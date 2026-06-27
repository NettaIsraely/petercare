import { DateTime, Settings } from 'luxon';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Feeding, FeedingStatus, ShiftType } from '../feedings/entities/feeding.entity';
import {
  FeedingNotificationsService,
  resolveFeedingAlertUtc,
} from './feeding-notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';

const mockAssignee = {
  morning_alert_time: '08:00:00',
  evening_alert_time: '18:00:00',
  timezone: 'Asia/Jerusalem',
};

describe('resolveFeedingAlertUtc', () => {
  const futureFeeding = {
    schedule_date: '2026-06-21',
    shift_type: ShiftType.MORNING,
  };

  it('uses HH:MM:SS override on the shift schedule date in stable timezone', () => {
    const alertUtc = resolveFeedingAlertUtc(futureFeeding, mockAssignee, '08:00:00');
    expect(alertUtc.toISO()).toBe('2026-06-21T05:00:00.000Z');
  });

  it('uses profile morning default when no override is provided', () => {
    const alertUtc = resolveFeedingAlertUtc(futureFeeding, mockAssignee);
    expect(alertUtc.toISO()).toBe('2026-06-21T05:00:00.000Z');
  });

  it('uses profile evening default for evening shifts', () => {
    const alertUtc = resolveFeedingAlertUtc(
      { schedule_date: '2026-06-21', shift_type: ShiftType.EVENING },
      mockAssignee,
    );
    expect(alertUtc.toISO()).toBe('2026-06-21T15:00:00.000Z');
  });

  it('accepts full ISO-8601 UTC datetime strings', () => {
    const alertUtc = resolveFeedingAlertUtc(
      futureFeeding,
      mockAssignee,
      '2026-06-21T06:30:00.000Z',
    );
    expect(alertUtc.toISO()).toBe('2026-06-21T06:30:00.000Z');
  });

  it('uses stable timezone regardless of assignee timezone field', () => {
    const alertUtc = resolveFeedingAlertUtc(
      futureFeeding,
      mockAssignee,
      '08:00:00',
      'Asia/Jerusalem',
    );
    expect(alertUtc.toISO()).toBe('2026-06-21T05:00:00.000Z');
  });

  it('does not treat HH:MM:SS as today at that UTC instant', () => {
    const alertUtc = resolveFeedingAlertUtc(futureFeeding, mockAssignee, '08:00:00');
    expect(alertUtc.toISODate()).toBe('2026-06-21');
  });
});

describe('FeedingNotificationsService', () => {
  let service: FeedingNotificationsService;
  let queueAdd: jest.Mock;
  let queueGetJob: jest.Mock;
  let feedingFind: jest.Mock;

  beforeEach(async () => {
    queueAdd = jest.fn();
    queueGetJob = jest.fn().mockResolvedValue(null);
    feedingFind = jest.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedingNotificationsService,
        {
          provide: getQueueToken('notifications'),
          useValue: {
            add: queueAdd,
            getJob: queueGetJob,
          },
        },
        {
          provide: NotificationPreferencesService,
          useValue: {
            filterEligibleUserIds: jest.fn(async (ids: string[]) => ids),
            isUserEligible: jest.fn(async () => true),
          },
        },
        {
          provide: getRepositoryToken(Feeding),
          useValue: {
            find: feedingFind,
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'Asia/Jerusalem') },
        },
      ],
    }).compile();

    service = module.get(FeedingNotificationsService);
  });

  afterEach(() => {
    Settings.now = () => new Date().getTime();
  });

  it('schedules a delayed reminder for a future shift with HH:MM:SS override', async () => {
    const fixedNow = DateTime.fromISO('2026-06-19T10:00:00.000Z').toMillis();
    Settings.now = () => fixedNow;

    await service.scheduleFeedingReminder(
      {
        id: 'feeding-1',
        schedule_date: new Date('2026-06-21T00:00:00.000Z'),
        shift_type: ShiftType.MORNING,
      } as never,
      { id: 'user-1', ...mockAssignee } as never,
      '08:00:00',
    );

    expect(queueAdd).toHaveBeenCalledWith(
      'feeding-reminder',
      expect.objectContaining({ userId: 'user-1' }),
      expect.objectContaining({
        delay: expect.any(Number),
        jobId: 'feeding-reminder-feeding-1',
      }),
    );

    const delay = queueAdd.mock.calls[0][2].delay as number;
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBe(
      DateTime.fromISO('2026-06-21T05:00:00.000Z').toMillis() -
        DateTime.fromISO('2026-06-19T10:00:00.000Z').toMillis(),
    );
  });

  it('uses delay 0 when today shift alert time is already past', async () => {
    const fixedNow = DateTime.fromISO('2026-06-19T10:00:00.000Z').toMillis();
    Settings.now = () => fixedNow;

    await service.scheduleFeedingReminder(
      {
        id: 'feeding-2',
        schedule_date: new Date('2026-06-19T00:00:00.000Z'),
        shift_type: ShiftType.MORNING,
      } as never,
      { id: 'user-1', ...mockAssignee } as never,
      '08:00:00',
    );

    expect(queueAdd.mock.calls[0][2].delay).toBe(0);
  });

  it('reschedules reminders for assigned feedings on or after today', async () => {
    const fixedNow = DateTime.fromISO('2026-06-19T10:00:00.000Z').toMillis();
    Settings.now = () => fixedNow;

    const user = { id: 'user-1', ...mockAssignee } as never;
    const tomorrowFeeding = {
      id: 'feeding-1',
      schedule_date: new Date('2026-06-21T00:00:00.000Z'),
      shift_type: ShiftType.MORNING,
      feeding_status: FeedingStatus.ASSIGNED,
    };

    feedingFind.mockResolvedValue([tomorrowFeeding]);

    await service.rescheduleFeedingRemindersForUser(user);

    expect(feedingFind).toHaveBeenCalledWith({
      where: {
        assigned_user: { id: 'user-1' },
        feeding_status: FeedingStatus.ASSIGNED,
        schedule_date: expect.any(Object),
      },
    });
    expect(queueAdd).toHaveBeenCalledTimes(1);
    expect(queueAdd).toHaveBeenCalledWith(
      'feeding-reminder',
      expect.objectContaining({ userId: 'user-1' }),
      expect.objectContaining({
        jobId: 'feeding-reminder-feeding-1',
        delay: expect.any(Number),
      }),
    );
  });

  it('does not enqueue reminders when user has no upcoming assigned feedings', async () => {
    feedingFind.mockResolvedValue([]);

    await service.rescheduleFeedingRemindersForUser({
      id: 'user-1',
      ...mockAssignee,
    } as never);

    expect(queueAdd).not.toHaveBeenCalled();
  });
});
