import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Treatment } from './entities/treatment.entity';
import { Repository } from 'typeorm';
import { Horse } from 'src/horses/entities/horse.entity';
import { SHOEING_TREATMENT_NAME } from './treatment.constants';
import {
  AuthUser,
  assertCanCompleteEvent,
  assertCanEditEvent,
  assertGuestCannotMutate,
  assertOwnerOnly,
} from '../common/event-permissions';

@Injectable()
export class TreatmentsService {
  constructor(
    @InjectRepository(Treatment)
    private readonly treatmentRepository: Repository<Treatment>,
    @InjectRepository(Horse)
    private readonly horseRepository: Repository<Horse>,
  ) {}

  async create(createTreatmentDto: CreateTreatmentDto, authUser: AuthUser): Promise<Treatment> {
    assertGuestCannotMutate(authUser);

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
    } else {
      assertCanEditEvent(authUser, 'treatment', existing);
    }

    const updateData: Record<string, unknown> = { id, ...updateTreatmentDto };

    if (updateTreatmentDto.horse_ids) {
      updateData.horses = updateTreatmentDto.horse_ids.map((horseId) => ({ id: horseId }));
      delete updateData.horse_ids;
    }

    if (updateTreatmentDto.user_id) {
      updateData.user = { id: updateTreatmentDto.user_id };
      delete updateData.user_id;
    }

    const treatment = await this.treatmentRepository.preload(updateData);

    if (!treatment) {
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }

    const saved = await this.treatmentRepository.save(treatment);

    const isNewlyComplete =
      updateTreatmentDto.is_complete === true && !existing.is_complete;

    if (isNewlyComplete && saved.name === SHOEING_TREATMENT_NAME) {
      await this.updateLastShoeingDates(saved);
    }

    return this.findOne(saved.id);
  }

  private async updateLastShoeingDates(treatment: Treatment): Promise<void> {
    const treatmentWithHorses = await this.findOne(treatment.id);
    for (const horse of treatmentWithHorses.horses) {
      horse.last_shoeing_date = treatmentWithHorses.date;
      await this.horseRepository.save(horse);
    }
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    assertOwnerOnly(authUser);

    const result = await this.treatmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }
  }
}
