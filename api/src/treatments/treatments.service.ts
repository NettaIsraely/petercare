import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Treatment } from './entities/treatment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TreatmentsService {
  constructor(
    @InjectRepository(Treatment)
    private readonly treatmentRepository: Repository<Treatment>,
  ) {}
  async create(createTreatmentDto: CreateTreatmentDto): Promise<Treatment> {
    const newTreatment = this.treatmentRepository.create({
      name: createTreatmentDto.name,
      user: {id: createTreatmentDto.user_id},
      horse: {id: createTreatmentDto.horse_id},
      duration_minutes: createTreatmentDto.duration_minutes,
      date: createTreatmentDto.date
    });
    return await this.treatmentRepository.save(newTreatment);
  }

  async findAll(): Promise<Treatment[]> {
    return await this.treatmentRepository.find({
      relations: {
        horse: true,
        user: true
      },
    });
  }

  async findOne(id: string): Promise<Treatment> {
    const treatment = await this.treatmentRepository.findOne({ where: { id } });
    if (!treatment){
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }
    return treatment;
  }

  async update(id: string, updateTreatmentDto: UpdateTreatmentDto): Promise<Treatment> {
    const updateData: any = {id, ...updateTreatmentDto};

    if (updateTreatmentDto.horse_id){
      updateData.horse = { id: updateData.horse_id };
    }

    if (updateTreatmentDto.user_id){
      updateData.user = { id: updateData.user_id };
    }

    const treatment = await this.treatmentRepository.preload(updateData);

    if (!treatment){
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }

    return await this.treatmentRepository.save(treatment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.treatmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }
  }
}
