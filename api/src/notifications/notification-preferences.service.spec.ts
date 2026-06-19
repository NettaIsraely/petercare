import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { NotificationPreferencesService } from './notification-preferences.service';

describe('NotificationPreferencesService', () => {
  let service: NotificationPreferencesService;

  const mockUser = {
    id: 'user-1',
    push_notifications_enabled: true,
    notify_feeding_reminders: true,
    notify_shift_reassigned: false,
    notify_unassigned_feeding: true,
    notify_feeding_incomplete_assignee: true,
    notify_feeding_incomplete_broadcast: false,
    notify_task_deadlines: true,
    notify_role_requests: true,
    notify_role_request_resolved: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferencesService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn().mockResolvedValue([mockUser]),
          },
        },
      ],
    }).compile();

    service = module.get(NotificationPreferencesService);
  });

  it('filters out users with master push disabled', async () => {
    const users = [
      {
        ...mockUser,
        id: 'user-2',
        push_notifications_enabled: false,
      },
    ];
    jest.spyOn(service['userRepository'], 'find').mockResolvedValue(users as User[]);

    const eligible = await service.filterEligibleUserIds(['user-2'], 'feeding-reminder');
    expect(eligible).toEqual([]);
  });

  it('filters out users with specific notification type disabled', async () => {
    const eligible = await service.filterEligibleUserIds(
      ['user-1'],
      'shift-reassigned-alert',
    );
    expect(eligible).toEqual([]);
  });

  it('includes users when preference is enabled', async () => {
    const eligible = await service.filterEligibleUserIds(
      ['user-1'],
      'feeding-reminder',
    );
    expect(eligible).toEqual(['user-1']);
  });
});
