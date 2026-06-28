import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { EventNotificationsService } from '../notifications/event-notifications.service';

const eventNotificationsMock = {
  notifyEventModified: jest.fn(),
  notifyRideJoined: jest.fn(),
};

describe('TasksService', () => {
  let service: TasksService;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'findOne'>>;
  let tasksRepository: jest.Mocked<
    Pick<Repository<Task>, 'create' | 'save' | 'findOne' | 'preload'>
  >;

  const caregiverAuth = {
    userId: 'caregiver-id',
    name: 'Caregiver',
    role: UserRole.CAREGIVER,
  };

  const ownerAuth = {
    userId: 'owner-id',
    name: 'Owner',
    role: UserRole.OWNER,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    userRepository = {
      findOne: jest.fn(),
    };
    tasksRepository = {
      create: jest.fn((value) => value as Task),
      save: jest.fn(async (value) => value as Task),
      findOne: jest.fn(),
      preload: jest.fn(),
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
        {
          provide: EventNotificationsService,
          useValue: eventNotificationsMock,
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

  it('calls notifyEventModified when assignee completes their own task', async () => {
    const existingTask = {
      id: 'task-1',
      name: 'Task',
      is_complete: false,
      assigned_user: { id: 'caregiver-id' },
    } as Task;
    const completedTask = { ...existingTask, is_complete: true };

    tasksRepository.findOne.mockResolvedValueOnce(existingTask).mockResolvedValueOnce(completedTask);
    tasksRepository.preload.mockResolvedValue(completedTask);
    tasksRepository.save.mockResolvedValue(completedTask);

    await service.update('task-1', { is_complete: true }, caregiverAuth);

    expect(eventNotificationsMock.notifyEventModified).toHaveBeenCalledWith(
      caregiverAuth,
      'task',
      completedTask,
    );
  });

  it('notifies assignee when someone else completes their task', async () => {
    const existingTask = {
      id: 'task-1',
      name: 'Task',
      is_complete: false,
      assigned_user: { id: 'caregiver-id' },
    } as Task;
    const completedTask = { ...existingTask, is_complete: true };

    tasksRepository.findOne.mockResolvedValueOnce(existingTask).mockResolvedValueOnce(completedTask);
    tasksRepository.preload.mockResolvedValue(completedTask);
    tasksRepository.save.mockResolvedValue(completedTask);

    await service.update('task-1', { is_complete: true }, ownerAuth);

    expect(eventNotificationsMock.notifyEventModified).toHaveBeenCalledWith(
      ownerAuth,
      'task',
      completedTask,
    );
  });

  it('does not notify when re-completing an already complete task', async () => {
    const alreadyComplete = {
      id: 'task-1',
      name: 'Task',
      is_complete: true,
      assigned_user: { id: 'caregiver-id' },
    } as Task;

    tasksRepository.findOne.mockResolvedValueOnce(alreadyComplete).mockResolvedValueOnce(alreadyComplete);
    tasksRepository.preload.mockResolvedValue(alreadyComplete);
    tasksRepository.save.mockResolvedValue(alreadyComplete);

    await service.update('task-1', { is_complete: true }, ownerAuth);

    expect(eventNotificationsMock.notifyEventModified).not.toHaveBeenCalled();
  });
});
