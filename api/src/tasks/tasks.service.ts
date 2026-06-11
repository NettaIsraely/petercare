import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>
  ){}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const newTask = this.tasksRepository.create({
      name: createTaskDto.name,
      deadline: createTaskDto.deadline,
      comments: createTaskDto.comments,
      assigned_user: createTaskDto.assigned_user_id ? { id: createTaskDto.assigned_user_id } : undefined
    })
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
    if (!task){
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const updateData: any = { id, ...updateTaskDto};
    if (updateData.assigned_user_id !== undefined){
      updateData.assigned_user_id = updateTaskDto.assigned_user_id ? { id: updateTaskDto.assigned_user_id } : null;
    }
    const task = await this.tasksRepository.preload({
      id: id,
      ...updateTaskDto
    })
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    };
    return await this.tasksRepository.save(task);
  }

  async claim(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.preload({
      id: id,
      assigned_user: { id: userId } as any
    });

    if (!task){
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return await this.tasksRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0){
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }
}
