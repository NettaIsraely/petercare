import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateFeedingDto } from './dto/update-feeding.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Feeding, FeedingStatus, ShiftType } from './entities/feeding.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { FeedingNotificationsService } from '../notifications/feeding-notifications.service';

@Injectable()
export class FeedingsService {
  constructor(
    @InjectRepository(Feeding)
    private readonly feedingRepository: Repository<Feeding>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly feedingNotifications: FeedingNotificationsService,
  ) {}

  async ensureShiftsForDate(dateStr: string): Promise<number> {
    let created = 0;

    for (const shiftType of [ShiftType.MORNING, ShiftType.EVENING]) {
      const existing = await this.feedingRepository.findOne({
        where: {
          schedule_date: dateStr as unknown as Date,
          shift_type: shiftType,
        },
      });

      if (!existing) {
        await this.createSystemShift(dateStr, shiftType);
        created += 1;
      }
    }

    return created;
  }

  async createSystemShift(scheduleDate: string, shiftType: ShiftType): Promise<Feeding> {
    const newShift = this.feedingRepository.create({
      schedule_date: scheduleDate,
      shift_type: shiftType,
      feeding_status: FeedingStatus.UNASSIGNED,
    });
    return this.feedingRepository.save(newShift);
  }

  async volunteer(
    feedingId: string,
    userId: string,
    customNotificationTime?: string,
  ): Promise<Feeding> {
    const shift = await this.feedingRepository.findOne({
      where: { id: feedingId },
      relations: { assigned_user: true },
    });

    if (!shift) {
      throw new NotFoundException('Feeding shift not found');
    }

    if (shift.feeding_status !== FeedingStatus.UNASSIGNED) {
      throw new BadRequestException('This feeding shift is no longer available to volunteer for');
    }

    const newUser = await this.userRepository.findOne({ where: { id: userId } });

    if (!newUser) {
      throw new NotFoundException('User not found');
    }

    if (newUser.role === UserRole.GUEST) {
      throw new ForbiddenException('Guests cannot volunteer for feeding shifts');
    }

    const previousUserId = shift.assigned_user?.id;

    shift.feeding_status = FeedingStatus.ASSIGNED;
    shift.assigned_user = { id: userId } as User;
    const savedShift = await this.feedingRepository.save(shift);

    if (previousUserId && previousUserId !== userId) {
      await this.feedingNotifications.notifyAssigneeChange(
        previousUserId,
        newUser,
        savedShift,
      );
    }

    await this.feedingNotifications.scheduleFeedingReminder(
      savedShift,
      newUser,
      customNotificationTime,
    );

    return savedShift;
  }

  async findAll(): Promise<Feeding[]> {
    return await this.feedingRepository.find({
      relations: { assigned_user: true },
    });
  }

  async findOne(id: string): Promise<Feeding> {
    const feeding = await this.feedingRepository.findOne({
      where: { id },
      relations: { assigned_user: true },
    });

    if (!feeding) {
      throw new NotFoundException(`Feeding shift with ID ${id} not found`);
    }

    return feeding;
  }

  async update(id: string, updateFeedingDto: UpdateFeedingDto): Promise<Feeding> {
    const existing = await this.feedingRepository.findOne({
      where: { id },
      relations: { assigned_user: true },
    });

    if (!existing) {
      throw new NotFoundException(`Feeding shift with ID ${id} not found`);
    }

    const previousUserId = existing.assigned_user?.id;
    const wasComplete = existing.feeding_status === FeedingStatus.COMPLETE;

    const { assigned_user_id, ...rest } = updateFeedingDto;
    const updateData: Record<string, unknown> = { id, ...rest };

    if (assigned_user_id !== undefined) {
      const isAssigned = !!assigned_user_id;
      updateData.assigned_user = isAssigned ? { id: assigned_user_id } : null;
      if (updateFeedingDto.feeding_status === undefined) {
        updateData.feeding_status = isAssigned
          ? FeedingStatus.ASSIGNED
          : FeedingStatus.UNASSIGNED;
      }
    }

    const feeding = await this.feedingRepository.preload(updateData);

    if (!feeding) {
      throw new NotFoundException(`Feeding shift with ID ${id} not found`);
    }

    const savedFeeding = await this.feedingRepository.save(feeding);

    const assigneeChanged =
      assigned_user_id !== undefined && assigned_user_id !== previousUserId;

    const markedComplete =
      updateFeedingDto.feeding_status === FeedingStatus.COMPLETE && !wasComplete;

    if (markedComplete || savedFeeding.feeding_status === FeedingStatus.COMPLETE) {
      await this.feedingNotifications.cancelFeedingReminder(id);
    } else if (assigneeChanged) {
      await this.feedingNotifications.cancelFeedingReminder(id);

      if (assigned_user_id) {
        const newAssignee = await this.userRepository.findOne({
          where: { id: assigned_user_id },
        });

        if (newAssignee) {
          if (previousUserId && previousUserId !== assigned_user_id) {
            await this.feedingNotifications.notifyAssigneeChange(
              previousUserId,
              newAssignee,
              savedFeeding,
            );
          }

          await this.feedingNotifications.scheduleFeedingReminder(
            savedFeeding,
            newAssignee,
          );
        }
      }
    }

    return savedFeeding;
  }

  async remove(id: string): Promise<void> {
    await this.feedingNotifications.cancelFeedingReminder(id);

    const result = await this.feedingRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Feeding shift with ID ${id} not found`);
    }
  }
}
