import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('TasksService', () => {
  let service: TasksService;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'findOne'>>;
  let tasksRepository: jest.Mocked<Pick<Repository<Task>, 'create' | 'save'>>;

  const caregiverAuth = {
    userId: 'caregiver-id',
    name: 'Caregiver',
    role: UserRole.CAREGIVER,
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
    };
    tasksRepository = {
      create: jest.fn((value) => value as Task),
      save: jest.fn(async (value) => value as Task),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: tasksRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('rejects guest assignees on create', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'guest-id',
      role: UserRole.GUEST,
    } as User);

    await expect(
      service.create(
        {
          name: 'Task',
          assigned_user_id: 'guest-id',
        },
        caregiverAuth,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates tasks with assignable users', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'owner-id',
      role: UserRole.OWNER,
    } as User);

    await service.create(
      {
        name: 'Task',
        assigned_user_id: 'owner-id',
      },
      caregiverAuth,
    );

    expect(tasksRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assigned_user: { id: 'owner-id' },
      }),
    );
  });
});
