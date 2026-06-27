import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedingsService } from './feedings.service';
import { Feeding } from './entities/feeding.entity';
import { User } from 'src/users/entities/user.entity';
import { FeedingNotificationsService } from '../notifications/feeding-notifications.service';
import { EventNotificationsService } from '../notifications/event-notifications.service';

describe('FeedingsService', () => {
  let service: FeedingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedingsService,
        {
          provide: getRepositoryToken(Feeding),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
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
});
