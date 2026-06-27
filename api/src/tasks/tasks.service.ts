import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
  AuthUser,
  assertAssignableUser,
  assertCanClaimTask,
  assertCanCompleteEvent,
  assertCanDeleteEvent,
  assertCanEditEvent,
  assertGuestCannotMutate,
} from '../common/event-permissions';
import { EventNotificationsService } from '../notifications/event-notifications.service';

function normalizeDate(value: Date | string | undefined): string | null {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString().split('T')[0];
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventNotifications: EventNotificationsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, authUser: AuthUser): Promise<Task> {
    assertGuestCannotMutate(authUser);
    await assertAssignableUser(this.userRepository, createTaskDto.assigned_user_id);

    const newTask = this.tasksRepository.create({
      name: createTaskDto.name,
      deadline: createTaskDto.deadline,
      comments: createTaskDto.comments,
      assigned_user: createTaskDto.assigned_user_id
        ? { id: createTaskDto.assigned_user_id }
        : undefined,
    });
    return await this.tasksRepository.save(newTask);
  }

  async findAll(): Promise<Task[]> {
    return await this.tasksRepository.find({ relations: { assigned_user: true } });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: { assigned_user: true },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, authUser: AuthUser): Promise<Task> {
    const existing = await this.findOne(id);

    const isCompleteOnly =
      updateTaskDto.is_complete === true &&
      updateTaskDto.name === undefined &&
      updateTaskDto.deadline === undefined &&
      updateTaskDto.comments === undefined &&
      updateTaskDto.assigned_user_id === undefined;

    if (isCompleteOnly) {
      assertCanCompleteEvent(authUser, 'task', existing);
    } else {
      assertCanEditEvent(authUser, 'task', existing);
    }

    const { assigned_user_id, ...rest } = updateTaskDto;
    const updateData: Record<string, unknown> = { id, ...rest };

    if (assigned_user_id !== undefined) {
      await assertAssignableUser(this.userRepository, assigned_user_id);
      updateData.assigned_user = assigned_user_id
        ? { id: assigned_user_id }
        : null;
    }

    const deadlineChanged =
      updateTaskDto.deadline !== undefined &&
      normalizeDate(updateTaskDto.deadline) !== normalizeDate(existing.deadline);

    if (deadlineChanged) {
      updateData.deadline_reminder_sent_at = null;
    }

    const task = await this.tasksRepository.preload(updateData);

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const saved = await this.tasksRepository.save(task);
    const full = await this.findOne(saved.id);
    await this.eventNotifications.notifyEventModified(authUser, 'task', full);
    return full;
  }

  async claim(id: string, userId: string, authUser: AuthUser): Promise<Task> {
    const existing = await this.findOne(id);
    assertCanClaimTask(authUser, existing);

    const task = await this.tasksRepository.preload({
      id: id,
      assigned_user: { id: userId } as Task['assigned_user'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return await this.tasksRepository.save(task);
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    assertCanDeleteEvent(authUser, 'task');

    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }
}
