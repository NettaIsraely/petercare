import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHorseDto } from './dto/create-horse.dto';
import { UpdateHorseDto } from './dto/update-horse.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Horse } from './entities/horse.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HorsesService {
  constructor(
    @InjectRepository(Horse)
    private readonly horseRepository: Repository<Horse>,
  ) {}

  async create(createHorseDto: CreateHorseDto): Promise<Horse> {
    const newHorse = this.horseRepository.create(createHorseDto);
    return await this.horseRepository.save(newHorse);
  }

  async findAll(): Promise<Horse[]> {
    return await this.horseRepository.find({ where: { is_active: true } });
  }

  async findOne(id: string): Promise<Horse> {
    const horse = await this.horseRepository.findOne({ where: { id } });
    if (!horse){
      throw new NotFoundException(`Horse with ID ${id} not found`);
    }
    return horse;
  }

  async update(id: string, updateHorseDto: UpdateHorseDto): Promise<Horse> {
    const horse = await this.horseRepository.preload({
      id: id,
      ...updateHorseDto
    });

    if (!horse){
      throw new NotFoundException(`Horse with ID ${id} not found`);
    }

    return await this.horseRepository.save(horse);
  }

  async remove(id: string): Promise<void> {
    const horse = await this.findOne(id);
    horse.is_active = false;
    await this.horseRepository.save(horse);
  }
}
