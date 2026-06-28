import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedingsService } from './feedings.service';
import { Feeding, FeedingStatus, ShiftType } from './entities/feeding.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { FeedingNotificationsService } from '../notifications/feeding-notifications.service';
import { EventNotificationsService } from '../notifications/event-notifications.service';

const authUser = {
  userId: 'user-1',
  name: 'Caregiver',
  role: UserRole.CAREGIVER,
};

describe('FeedingsService', () => {
  let service: FeedingsService;
  let findOneMock: jest.Mock;
  let preloadMock: jest.Mock;
  let saveMock: jest.Mock;
  let userFindOneMock: jest.Mock;

  const assignee: User = {
    id: 'user-1',
    name: 'Caregiver',
    email: 'caregiver@example.com',
    role: UserRole.CAREGIVER,
    created_at: new Date(),
    updated_at: new Date(),
  } as User;

  const completeFeeding: Feeding = {
    id: 'feeding-1',
    schedule_date: new Date('2026-06-20'),
    shift_type: ShiftType.MORNING,
    feeding_status: FeedingStatus.COMPLETE,
    assigned_user: assignee,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    findOneMock = jest.fn();
    preloadMock = jest.fn();
    saveMock = jest.fn();
    userFindOneMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedingsService,
        {
          provide: getRepositoryToken(Feeding),
          useValue: {
            findOne: findOneMock,
            preload: preloadMock,
            save: saveMock,
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: userFindOneMock,
          },
        },
        {
          provide: FeedingNotificationsService,
          useValue: {
            cancelFeedingReminder: jest.fn(),
            notifyAssigneeChange: jest.fn(),
            scheduleFeedingReminder: jest.fn(),
          },
        },
        {
          provide: EventNotificationsService,
          useValue: {
            notifyEventModified: jest.fn(),
            notifyRideJoined: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeedingsService>(FeedingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('keeps assignee when marking a completed feeding incomplete', async () => {
      const assignedFeeding: Feeding = {
        ...completeFeeding,
        feeding_status: FeedingStatus.ASSIGNED,
        assigned_user: assignee,
      };

      findOneMock
        .mockResolvedValueOnce(completeFeeding)
        .mockResolvedValueOnce(assignedFeeding);
      preloadMock.mockImplementation((data: Record<string, unknown>) =>
        Promise.resolve({ ...data }),
      );
      saveMock.mockImplementation((feeding: Feeding) => Promise.resolve(feeding));
      userFindOneMock.mockResolvedValue(assignee);

      const result = await service.update(
        'feeding-1',
        { feeding_status: FeedingStatus.ASSIGNED },
        authUser,
      );

      expect(preloadMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'feeding-1',
          feeding_status: FeedingStatus.ASSIGNED,
          assigned_user: { id: 'user-1' },
        }),
      );
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          feeding_status: FeedingStatus.ASSIGNED,
          assigned_user: { id: 'user-1' },
        }),
      );
      expect(result.feeding_status).toBe(FeedingStatus.ASSIGNED);
      expect(result.assigned_user?.id).toBe('user-1');
    });
  });
});
