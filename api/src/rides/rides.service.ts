import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { Ride } from './entities/ride.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AuthUser,
  assertCanEditEvent,
  assertGuestCannotMutate,
  assertOwnerOnly,
} from '../common/event-permissions';

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private readonly ridesRepository: Repository<Ride>,
  ) {}

  async create(createRideDto: CreateRideDto, authUser: AuthUser): Promise<Ride> {
    assertGuestCannotMutate(authUser);

    const newRide = this.ridesRepository.create({
      date: createRideDto.date,
      start_time: createRideDto.start_time,
      end_time: createRideDto.end_time,
      primary_rider: { id: createRideDto.primary_rider_id },

      additional_riders: createRideDto.additional_riders_ids
        ? createRideDto.additional_riders_ids.map((id) => ({ id }))
        : [],
      horses: createRideDto.horses.map((id) => ({ id })),
      comments: createRideDto.comments,
    });

    return await this.ridesRepository.save(newRide);
  }

  async findAll(): Promise<Ride[]> {
    return await this.ridesRepository.find({
      relations: {
        primary_rider: true,
        additional_riders: true,
        horses: true,
      },
    });
  }

  async findOne(id: string): Promise<Ride> {
    const ride = await this.ridesRepository.findOne({
      where: { id },
      relations: {
        primary_rider: true,
        additional_riders: true,
        horses: true,
      },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    return ride;
  }

  async update(id: string, updateRideDto: UpdateRideDto, authUser: AuthUser): Promise<Ride> {
    const existing = await this.findOne(id);
    assertCanEditEvent(authUser, 'ride', existing);

    const updateData: Record<string, unknown> = { id, ...updateRideDto };
    if (updateRideDto.primary_rider_id) {
      updateData.primary_rider = { id: updateRideDto.primary_rider_id };
    }
    if (updateRideDto.additional_riders_ids) {
      updateData.additional_riders = updateRideDto.additional_riders_ids.map((rid) => ({
        id: rid,
      }));
    }
    if (updateRideDto.horses) {
      updateData.horses = updateRideDto.horses.map((horseId) => ({ id: horseId }));
    }

    const ride = await this.ridesRepository.preload(updateData);

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    return await this.ridesRepository.save(ride);
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    assertOwnerOnly(authUser);

    const result = await this.ridesRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }
  }
}
