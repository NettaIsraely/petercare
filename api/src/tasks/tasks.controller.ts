import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { AuthUser } from 'src/common/event-permissions';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.CAREGIVER)
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: { user: AuthUser }) {
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.CAREGIVER)
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: { user: AuthUser },
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  @Patch(':id/claim')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.CAREGIVER)
  claim(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.tasksService.claim(id, req.user.userId, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.tasksService.remove(id, req.user);
  }
}
