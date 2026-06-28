import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Treatment } from './entities/treatment.entity';
import { Repository } from 'typeorm';
import { Horse } from 'src/horses/entities/horse.entity';
import { User } from '../users/entities/user.entity';
import { SHOEING_TREATMENT_NAME } from './treatment.constants';
import { formatScheduleDate } from '../common/timezone.util';
import {
  AuthUser,
  assertAssignableUser,
  assertCanCompleteEvent,
  assertCanDeleteEvent,
  assertCanEditEvent,
  assertGuestCannotMutate,
} from '../common/event-permissions';
import { EventNotificationsService } from '../notifications/event-notifications.service';

@Injectable()
export class TreatmentsService {
  constructor(
    @InjectRepository(Treatment)
    private readonly treatmentRepository: Repository<Treatment>,
    @InjectRepository(Horse)
    private readonly horseRepository: Repository<Horse>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventNotifications: EventNotificationsService,
  ) {}

  async create(createTreatmentDto: CreateTreatmentDto, authUser: AuthUser): Promise<Treatment> {
    assertGuestCannotMutate(authUser);
    await assertAssignableUser(this.userRepository, createTreatmentDto.user_id);

    const newTreatment = this.treatmentRepository.create({
      name: createTreatmentDto.name,
      user: { id: createTreatmentDto.user_id },
      horses: createTreatmentDto.horse_ids.map((id) => ({ id })),
      duration_minutes: createTreatmentDto.duration_minutes,
      date: createTreatmentDto.date,
    });
    const saved = await this.treatmentRepository.save(newTreatment);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<Treatment[]> {
    return await this.treatmentRepository.find({
      relations: {
        horses: true,
        user: true,
      },
    });
  }

  async findCompletedForHorse(horseId: string): Promise<Treatment[]> {
    const horse = await this.horseRepository.findOne({ where: { id: horseId } });
    if (!horse) {
      throw new NotFoundException(`Horse with ID ${horseId} not found`);
    }

    return this.treatmentRepository
      .createQueryBuilder('treatment')
      .innerJoin('treatment.horses', 'filterHorse', 'filterHorse.id = :horseId', {
        horseId,
      })
      .leftJoinAndSelect('treatment.horses', 'horses')
      .leftJoinAndSelect('treatment.user', 'user')
      .where('treatment.is_complete = :complete', { complete: true })
      .orderBy('treatment.date', 'DESC')
      .addOrderBy('treatment.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Treatment> {
    const treatment = await this.treatmentRepository.findOne({
      where: { id },
      relations: {
        horses: true,
        user: true,
      },
    });
    if (!treatment) {
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }
    return treatment;
  }

  async update(
    id: string,
    updateTreatmentDto: UpdateTreatmentDto,
    authUser: AuthUser,
  ): Promise<Treatment> {
    const existing = await this.findOne(id);

    const isCompleteOnly =
      updateTreatmentDto.is_complete === true &&
      updateTreatmentDto.name === undefined &&
      updateTreatmentDto.date === undefined &&
      updateTreatmentDto.duration_minutes === undefined &&
      updateTreatmentDto.horse_ids === undefined &&
      updateTreatmentDto.user_id === undefined;

    if (isCompleteOnly) {
      assertCanCompleteEvent(authUser, 'treatment', existing);
      const wasIncomplete = !existing.is_complete;
      existing.is_complete = true;
      const saved = await this.treatmentRepository.save(existing);

      if (
        this.shouldRecomputeShoeingSync(existing, saved, updateTreatmentDto, true, wasIncomplete)
      ) {
        await this.recomputeLastShoeingDatesForHorses(this.collectHorseIds(existing, saved));
      }

      const full = await this.findOne(saved.id);
      if (wasIncomplete) {
        await this.eventNotifications.notifyEventModified(authUser, 'treatment', full);
      }
      return full;
    }

    assertCanEditEvent(authUser, 'treatment', existing);

    const updateData: Record<string, unknown> = { id, ...updateTreatmentDto };

    if (updateTreatmentDto.horse_ids) {
      updateData.horses = updateTreatmentDto.horse_ids.map((horseId) => ({ id: horseId }));
      delete updateData.horse_ids;
    }

    if (updateTreatmentDto.user_id) {
      await assertAssignableUser(this.userRepository, updateTreatmentDto.user_id);
      updateData.user = { id: updateTreatmentDto.user_id };
      delete updateData.user_id;
    }

    const treatment = await this.treatmentRepository.preload(updateData);

    if (!treatment) {
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }

    const saved = await this.treatmentRepository.save(treatment);

    if (this.shouldRecomputeShoeingSync(existing, saved, updateTreatmentDto, false, false)) {
      await this.recomputeLastShoeingDatesForHorses(this.collectHorseIds(existing, saved));
    }

    const full = await this.findOne(saved.id);
    await this.eventNotifications.notifyEventModified(authUser, 'treatment', full);
    return full;
  }

  async recomputeLastShoeingDatesForHorses(horseIds: string[]): Promise<void> {
    const uniqueHorseIds = [...new Set(horseIds)];
    for (const horseId of uniqueHorseIds) {
      await this.recomputeLastShoeingDateForHorse(horseId);
    }
  }

  async recomputeLastShoeingDateForHorse(horseId: string): Promise<void> {
    const horse = await this.horseRepository.findOne({ where: { id: horseId } });
    if (!horse) {
      return;
    }

    const latestShoeing = await this.treatmentRepository
      .createQueryBuilder('treatment')
      .innerJoin('treatment.horses', 'horse', 'horse.id = :horseId', { horseId })
      .where('treatment.name = :name', { name: SHOEING_TREATMENT_NAME })
      .andWhere('treatment.is_complete = :complete', { complete: true })
      .orderBy('treatment.date', 'DESC')
      .addOrderBy('treatment.created_at', 'DESC')
      .getOne();

    horse.last_shoeing_date = latestShoeing?.date ?? (null as unknown as Date);
    await this.horseRepository.save(horse);
  }

  private collectHorseIds(...treatments: Treatment[]): string[] {
    const horseIds = new Set<string>();
    for (const treatment of treatments) {
      for (const horse of treatment.horses ?? []) {
        horseIds.add(horse.id);
      }
    }
    return [...horseIds];
  }

  private shouldRecomputeShoeingSync(
    existing: Treatment,
    saved: Treatment,
    updateTreatmentDto: UpdateTreatmentDto,
    isCompleteOnly: boolean,
    wasIncomplete: boolean,
  ): boolean {
    const affectsShoeing =
      existing.name === SHOEING_TREATMENT_NAME || saved.name === SHOEING_TREATMENT_NAME;

    if (!affectsShoeing) {
      return false;
    }

    if (isCompleteOnly) {
      return updateTreatmentDto.is_complete === true && wasIncomplete;
    }

    const newlyComplete =
      updateTreatmentDto.is_complete === true && !existing.is_complete;
    const newlyIncomplete =
      updateTreatmentDto.is_complete === false && existing.is_complete;
    const dateChanged =
      updateTreatmentDto.date !== undefined &&
      formatScheduleDate(existing.date) !== formatScheduleDate(updateTreatmentDto.date);
    const horsesChanged =
      updateTreatmentDto.horse_ids !== undefined &&
      !this.sameHorseIds(existing.horses, updateTreatmentDto.horse_ids);
    const nameChanged =
      updateTreatmentDto.name !== undefined && existing.name !== updateTreatmentDto.name;

    return newlyComplete || newlyIncomplete || dateChanged || horsesChanged || nameChanged;
  }

  private sameHorseIds(horses: Horse[], horseIds: string[]): boolean {
    const existingIds = [...new Set(horses.map((horse) => horse.id))].sort();
    const nextIds = [...new Set(horseIds)].sort();
    return (
      existingIds.length === nextIds.length &&
      existingIds.every((id, index) => id === nextIds[index])
    );
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    assertCanDeleteEvent(authUser, 'treatment');

    const existing = await this.findOne(id);
    const horseIds =
      existing.name === SHOEING_TREATMENT_NAME && existing.is_complete
        ? this.collectHorseIds(existing)
        : [];

    const result = await this.treatmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }

    if (horseIds.length > 0) {
      await this.recomputeLastShoeingDatesForHorses(horseIds);
    }
  }
}
