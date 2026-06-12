import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { Ride } from './entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  AuthUser,
  assertAssignableUser,
  assertAssignableUsers,
  assertCanEditEvent,
  assertGuestCannotMutate,
  assertOwnerOnly,
} from '../common/event-permissions';
import {
  buildConflictMessage,
  buildCreateRideConflictParams,
  buildEffectiveRideConflictParams,
  ConflictEntry,
  dedupeConflictEntries,
  RideConflictParams,
} from './ride-conflicts';

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private readonly ridesRepository: Repository<Ride>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(createRideDto: CreateRideDto, authUser: AuthUser): Promise<Ride> {
    assertGuestCannotMutate(authUser);
    await assertAssignableUser(this.userRepository, createRideDto.primary_rider_id);
    await assertAssignableUsers(this.userRepository, createRideDto.additional_riders_ids);

    const conflictParams = buildCreateRideConflictParams(createRideDto);

    return this.dataSource.transaction(async (manager) => {
      this.assertValidTimeRange(conflictParams.start_time, conflictParams.end_time);
      await this.acquireSchedulingLocks(manager, conflictParams);
      await this.assertNoSchedulingConflicts(manager, conflictParams);

      const newRide = manager.create(Ride, {
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

      return manager.save(newRide);
    });
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

    if (updateRideDto.primary_rider_id) {
      await assertAssignableUser(this.userRepository, updateRideDto.primary_rider_id);
    }
    if (updateRideDto.additional_riders_ids) {
      await assertAssignableUsers(this.userRepository, updateRideDto.additional_riders_ids);
    }

    const conflictParams = buildEffectiveRideConflictParams(existing, updateRideDto, id);

    return this.dataSource.transaction(async (manager) => {
      this.assertValidTimeRange(conflictParams.start_time, conflictParams.end_time);
      await this.acquireSchedulingLocks(manager, conflictParams);
      await this.assertNoSchedulingConflicts(manager, conflictParams);

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

      const ride = await manager.preload(Ride, updateData);

      if (!ride) {
        throw new NotFoundException(`Ride with ID ${id} not found`);
      }

      return manager.save(ride);
    });
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    assertOwnerOnly(authUser);

    const result = await this.ridesRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }
  }

  private assertValidTimeRange(startTime: string, endTime: string): void {
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  private async acquireSchedulingLocks(
    manager: EntityManager,
    params: RideConflictParams,
  ): Promise<void> {
    const lockKeys = [
      ...params.horseIds.map((horseId) => `horse:${params.date}:${horseId}`),
      ...params.riderIds.map((riderId) => `rider:${params.date}:${riderId}`),
    ].sort();

    for (const key of lockKeys) {
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [key]);
    }
  }

  private async assertNoSchedulingConflicts(
    manager: EntityManager,
    params: RideConflictParams,
  ): Promise<void> {
    const horseConflicts = params.horseIds.length
      ? await this.findHorseConflicts(manager, params)
      : [];
    const riderConflicts = params.riderIds.length
      ? await this.findRiderConflicts(manager, params)
      : [];

    if (horseConflicts.length === 0 && riderConflicts.length === 0) {
      return;
    }

    const horses = dedupeConflictEntries(horseConflicts);
    const riders = dedupeConflictEntries(riderConflicts);

    throw new ConflictException({
      message: buildConflictMessage({ horses, riders }),
      conflicts: { horses, riders },
    });
  }

  private async findHorseConflicts(
    manager: EntityManager,
    params: RideConflictParams,
  ): Promise<ConflictEntry[]> {
    const query = manager
      .createQueryBuilder(Ride, 'ride')
      .innerJoin('ride.horses', 'horse')
      .select('horse.name', 'name')
      .addSelect('ride.start_time', 'start_time')
      .addSelect('ride.end_time', 'end_time')
      .where('ride.date = :date', { date: params.date })
      .andWhere('horse.id IN (:...horseIds)', { horseIds: params.horseIds })
      .andWhere('ride.start_time < :endTime', { endTime: params.end_time })
      .andWhere('ride.end_time > :startTime', { startTime: params.start_time });

    if (params.excludeRideId) {
      query.andWhere('ride.id != :excludeRideId', { excludeRideId: params.excludeRideId });
    }

    const rows = await query.getRawMany<{
      name: string;
      start_time: string;
      end_time: string;
    }>();

    return rows.map((row) => ({
      name: row.name,
      start_time: row.start_time,
      end_time: row.end_time,
    }));
  }

  private async findRiderConflicts(
    manager: EntityManager,
    params: RideConflictParams,
  ): Promise<ConflictEntry[]> {
    const primaryQuery = manager
      .createQueryBuilder(Ride, 'ride')
      .innerJoin('ride.primary_rider', 'rider')
      .select('rider.name', 'name')
      .addSelect('ride.start_time', 'start_time')
      .addSelect('ride.end_time', 'end_time')
      .where('ride.date = :date', { date: params.date })
      .andWhere('rider.id IN (:...riderIds)', { riderIds: params.riderIds })
      .andWhere('ride.start_time < :endTime', { endTime: params.end_time })
      .andWhere('ride.end_time > :startTime', { startTime: params.start_time });

    if (params.excludeRideId) {
      primaryQuery.andWhere('ride.id != :excludeRideId', {
        excludeRideId: params.excludeRideId,
      });
    }

    const additionalQuery = manager
      .createQueryBuilder(Ride, 'ride')
      .innerJoin('ride.additional_riders', 'rider')
      .select('rider.name', 'name')
      .addSelect('ride.start_time', 'start_time')
      .addSelect('ride.end_time', 'end_time')
      .where('ride.date = :date', { date: params.date })
      .andWhere('rider.id IN (:...riderIds)', { riderIds: params.riderIds })
      .andWhere('ride.start_time < :endTime', { endTime: params.end_time })
      .andWhere('ride.end_time > :startTime', { startTime: params.start_time });

    if (params.excludeRideId) {
      additionalQuery.andWhere('ride.id != :excludeRideId', {
        excludeRideId: params.excludeRideId,
      });
    }

    const [primaryRows, additionalRows] = await Promise.all([
      primaryQuery.getRawMany<{ name: string; start_time: string; end_time: string }>(),
      additionalQuery.getRawMany<{ name: string; start_time: string; end_time: string }>(),
    ]);

    return [...primaryRows, ...additionalRows].map((row) => ({
      name: row.name,
      start_time: row.start_time,
      end_time: row.end_time,
    }));
  }
}
