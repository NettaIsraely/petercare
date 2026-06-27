import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { User, UserProfileColor, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { isValidTimezone, normalizeTimeString } from '../common/timezone.util';
import { FeedingNotificationsService } from '../notifications/feeding-notifications.service';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  display_order: number;
  morning_alert_time: string;
  evening_alert_time: string;
  timezone: string;
  expo_push_token?: string;
  profile_color?: UserProfileColor | null;
  push_notifications_enabled: boolean;
  notify_feeding_reminders: boolean;
  notify_shift_reassigned: boolean;
  notify_unassigned_feeding: boolean;
  notify_feeding_incomplete_assignee: boolean;
  notify_feeding_incomplete_broadcast: boolean;
  notify_task_deadlines: boolean;
  notify_role_requests: boolean;
  notify_role_request_resolved: boolean;
  notify_event_modified: boolean;
  created_at: Date;
  updated_at: Date;
};

const ASSIGNABLE_ROLES = [UserRole.OWNER, UserRole.CAREGIVER];

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly feedingNotifications: FeedingNotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDisplayOrdersInitialized();
    await this.backfillProfileColors();
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      display_order: user.display_order,
      morning_alert_time: user.morning_alert_time,
      evening_alert_time: user.evening_alert_time,
      timezone: user.timezone,
      expo_push_token: user.expo_push_token,
      profile_color: user.profile_color,
      push_notifications_enabled: user.push_notifications_enabled,
      notify_feeding_reminders: user.notify_feeding_reminders,
      notify_shift_reassigned: user.notify_shift_reassigned,
      notify_unassigned_feeding: user.notify_unassigned_feeding,
      notify_feeding_incomplete_assignee: user.notify_feeding_incomplete_assignee,
      notify_feeding_incomplete_broadcast: user.notify_feeding_incomplete_broadcast,
      notify_task_deadlines: user.notify_task_deadlines,
      notify_role_requests: user.notify_role_requests,
      notify_role_request_resolved: user.notify_role_request_resolved,
      notify_event_modified: user.notify_event_modified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const role = createUserDto.role ?? UserRole.GUEST;
    const displayOrder = ASSIGNABLE_ROLES.includes(role)
      ? await this.getNextDisplayOrder()
      : 0;

    const newUser = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password_hash: hashedPassword,
      role,
      display_order: displayOrder,
      profile_color: this.pickRandomProfileColor(),
    });
    const saved = await this.userRepository.save(newUser);
    return this.toPublicUser(saved);
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.userRepository.find();
    return users.map((user) => this.toPublicUser(user));
  }

  async findAssignable(): Promise<PublicUser[]> {
    await this.ensureDisplayOrdersInitialized();

    const users = await this.userRepository.find({
      where: { role: In(ASSIGNABLE_ROLES) },
      order: { display_order: 'ASC', name: 'ASC' },
    });
    return users.map((user) => this.toPublicUser(user));
  }

  async updateDisplayOrder(userIds: string[]): Promise<PublicUser[]> {
    const uniqueIds = new Set(userIds);
    if (uniqueIds.size !== userIds.length) {
      throw new BadRequestException('Duplicate user IDs are not allowed.');
    }

    const assignableUsers = await this.userRepository.find({
      where: { role: In(ASSIGNABLE_ROLES) },
    });

    if (userIds.length !== assignableUsers.length) {
      throw new BadRequestException(
        'The user list must include every owner and caregiver exactly once.',
      );
    }

    const assignableById = new Map(assignableUsers.map((user) => [user.id, user]));

    for (const userId of userIds) {
      const user = assignableById.get(userId);
      if (!user) {
        throw new BadRequestException(
          'Every user ID must belong to an owner or caregiver.',
        );
      }
    }

    await this.userRepository.manager.transaction(async (manager) => {
      for (let index = 0; index < userIds.length; index += 1) {
        await manager.update(User, userIds[index], { display_order: index + 1 });
      }
    });

    return this.findAssignable();
  }

  async assignDisplayOrderForRole(user: User): Promise<void> {
    if (!ASSIGNABLE_ROLES.includes(user.role)) {
      return;
    }
    user.display_order = await this.getNextDisplayOrder();
    await this.userRepository.save(user);
  }

  async findOne(id: string): Promise<PublicUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.toPublicUser(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByResetToken(token: string) {
    return this.userRepository.findOne({
      where: { reset_password_token: token },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<PublicUser> {
    if (updateUserDto.timezone !== undefined && !isValidTimezone(updateUserDto.timezone)) {
      throw new BadRequestException('Invalid IANA timezone identifier.');
    }

    if (
      updateUserDto.profile_color !== undefined &&
      !Object.values(UserProfileColor).includes(updateUserDto.profile_color)
    ) {
      throw new BadRequestException('Invalid profile color.');
    }

    const existing = await this.userRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = { id, ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password_hash = await bcrypt.hash(updateUserDto.password, 10);
      delete updateData.password;
    }

    const user = await this.userRepository.preload(updateData);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const saved = await this.userRepository.save(user);

    if (this.didAlertScheduleChange(existing, updateUserDto)) {
      await this.feedingNotifications.rescheduleFeedingRemindersForUser(saved);
    }

    return this.toPublicUser(saved);
  }

  private didAlertScheduleChange(existing: User, updateUserDto: UpdateUserDto): boolean {
    if (
      updateUserDto.morning_alert_time !== undefined &&
      normalizeTimeString(updateUserDto.morning_alert_time) !==
        normalizeTimeString(existing.morning_alert_time)
    ) {
      return true;
    }

    if (
      updateUserDto.evening_alert_time !== undefined &&
      normalizeTimeString(updateUserDto.evening_alert_time) !==
        normalizeTimeString(existing.evening_alert_time)
    ) {
      return true;
    }

    if (
      updateUserDto.timezone !== undefined &&
      updateUserDto.timezone !== existing.timezone
    ) {
      return true;
    }

    return false;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  private async getNextDisplayOrder(): Promise<number> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('MAX(user.display_order)', 'max')
      .where('user.role IN (:...roles)', { roles: ASSIGNABLE_ROLES })
      .getRawOne<{ max: string | null }>();

    const currentMax = result?.max ? Number(result.max) : 0;
    return currentMax + 1;
  }

  private pickRandomProfileColor(): UserProfileColor {
    const colors = Object.values(UserProfileColor);
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private async backfillProfileColors(): Promise<void> {
    const usersWithoutColor = await this.userRepository.find({
      where: { profile_color: IsNull() },
    });

    if (usersWithoutColor.length === 0) {
      return;
    }

    for (const user of usersWithoutColor) {
      user.profile_color = this.pickRandomProfileColor();
    }

    await this.userRepository.save(usersWithoutColor);
  }

  private async ensureDisplayOrdersInitialized(): Promise<void> {
    const assignableUsers = await this.userRepository.find({
      where: { role: In(ASSIGNABLE_ROLES) },
      order: { created_at: 'ASC' },
    });

    if (assignableUsers.length <= 1) {
      if (assignableUsers.length === 1 && assignableUsers[0].display_order === 0) {
        assignableUsers[0].display_order = 1;
        await this.userRepository.save(assignableUsers[0]);
      }
      return;
    }

    const allUnset = assignableUsers.every((user) => user.display_order === 0);
    if (!allUnset) {
      return;
    }

    for (let index = 0; index < assignableUsers.length; index += 1) {
      assignableUsers[index].display_order = index + 1;
    }
    await this.userRepository.save(assignableUsers);
  }
}
