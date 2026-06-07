import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFeedingDto } from './dto/create-feeding.dto';
import { UpdateFeedingDto } from './dto/update-feeding.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Feeding, FeedingStatus, ShiftType } from './entities/feeding.entity';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class FeedingsService {
  constructor(
    @InjectRepository(Feeding)
    private readonly feedingRepository: Repository<Feeding>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
  ){}

  async create(createFeedingDto: CreateFeedingDto): Promise<Feeding> {
    const isAssigned = !!createFeedingDto.assigned_user_id;

    const newShift = this.feedingRepository.create({
      schedule_date: createFeedingDto.schedule_date,
      shift_type: createFeedingDto.shift_type,
      feeding_status: isAssigned ? FeedingStatus.ASSIGNED : FeedingStatus.UNASSIGNED,
      assigned_user: isAssigned ? {id: createFeedingDto.assigned_user_id} : undefined
    });
    return await this.feedingRepository.save(newShift);
  }

  async volunteer(feedingId: string, userId: string, customNotificationTime?: string): Promise<Feeding> {
    // Find the shift to update and take the previously assigned user to notify about the change
    const shift = await this.feedingRepository.findOne({
      where: {id: feedingId}, 
      relations: {assigned_user: true}});

    if (!shift){
      throw new NotFoundException('Feeding shift not found');
    }

    const previousUserId = shift.assigned_user?.id;
    const newUser = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!newUser) {
      throw new NotFoundException('User not found');
    }

    // Save the new assigned user to the shift
    shift.feeding_status = FeedingStatus.ASSIGNED;
    shift.assigned_user = {id: userId} as any;
    const savedShift = await this.feedingRepository.save(shift);

    // Notify the previous user about the change
    if (previousUserId && previousUserId !== userId) {
      await this.notificationQueue.add(
        'shift-reassigned-alert',
        {
          userId: previousUserId,
          shiftType: shift.shift_type,
          message: `Heads up! ${newUser?.name} covered your ${shift.shift_type} feeding shift on ${shift.schedule_date}.`
        }
      )
    }

    // Notificaion logic:
    let targetDateMs = 0;

    if (customNotificationTime){
      // Priority 1: one time custom time change
      targetDateMs = new Date(customNotificationTime).getTime();
    }
    else {
      // Priority 2: the user's default alert time
      const prefferedTime = shift.shift_type === ShiftType.MORNING ? newUser.morning_alert_time : newUser.evening_alert_time;
      // Get the date out of the format
      const formattedDate = new Date(shift.schedule_date).toISOString().split('T')[0];
      // Mash it with the time
      targetDateMs = new Date(`${formattedDate}T${prefferedTime}`).getTime();
    }

    // Calculate the delay
    const now = new Date().getTime();
    const computedDelay = Math.max(0, targetDateMs - now);

    // Create a feeding notification for the newly assigned user
    await this.notificationQueue.add(
      'feeding-reminder',
      {
        userId: userId,
        shiftType: shift.shift_type,
        message: `Reminder: You have the ${shift.shift_type} feeding shift coming up!`
      },
      {delay: computedDelay}
    )

    return savedShift;
  }

  async findAll(): Promise<Feeding[]> {
    return await this.feedingRepository.find({
      relations: { assigned_user: true },
    });
  }

  async findOne(id: string): Promise<Feeding> {
    const feeding = await this.feedingRepository.findOne({
      where: {id},
      relations: {assigned_user: true}
    });

    if (!feeding){
      throw new NotFoundException(`Feeding shift with ID ${id} not found`)
    }

    return feeding;
  }

  async update(id: string, updateFeedingDto: UpdateFeedingDto): Promise<Feeding> {
    const updateData: any = {id, ...updateFeedingDto};

    if (updateFeedingDto.assigned_user_id !== undefined){
      const isAssigned = !!updateFeedingDto.assigned_user_id;
      updateData.assigned_user = isAssigned ? { id: updateFeedingDto.assigned_user_id } : null;
      updateData.feeding_status = isAssigned ? FeedingStatus.ASSIGNED : FeedingStatus.UNASSIGNED;
    }

    const feeding = await this.feedingRepository.preload(updateData);
    
    if (!feeding){
      throw new NotFoundException(`Feeding shift with ID ${id} not found`)
    }

    return await this.feedingRepository.save(feeding);
  }

  async remove(id: string): Promise<void> {
    const result = await this.feedingRepository.delete(id);
    if (result.affected === 0){
      throw new NotFoundException(`Feeding shift with ID ${id} not found`)
    }
  }
}
