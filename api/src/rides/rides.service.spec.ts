import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { RidesService } from './rides.service';
import { Ride } from './entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';

const authUser = {
  userId: 'owner-id',
  name: 'Owner',
  role: UserRole.OWNER,
};

function createQueryBuilderMock(rows: { name: string; start_time: string; end_time: string }[]) {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
}

describe('RidesService', () => {
  let service: RidesService;
  let horseConflictRows: { name: string; start_time: string; end_time: string }[];
  let riderConflictRows: { name: string; start_time: string; end_time: string }[];
  let saveMock: jest.Mock;
  let createMock: jest.Mock;
  let preloadMock: jest.Mock;
  let queryMock: jest.Mock;
  let findOneMock: jest.Mock;

  beforeEach(async () => {
    horseConflictRows = [];
    riderConflictRows = [];
    saveMock = jest.fn().mockImplementation((ride) => Promise.resolve({ id: 'ride-new', ...ride }));
    createMock = jest.fn().mockImplementation((_, data) => data);
    preloadMock = jest.fn().mockResolvedValue({ id: 'ride-1', comments: 'Updated' });
    queryMock = jest.fn().mockResolvedValue(undefined);
    findOneMock = jest.fn();

    let queryBuilderCall = 0;
    const createQueryBuilder = jest.fn(() => {
      queryBuilderCall += 1;
      if (queryBuilderCall === 1) {
        return createQueryBuilderMock(horseConflictRows);
      }
      if (queryBuilderCall === 2 || queryBuilderCall === 3) {
        return createQueryBuilderMock(riderConflictRows);
      }
      return createQueryBuilderMock([]);
    });

    const entityManager = {
      create: createMock,
      save: saveMock,
      preload: preloadMock,
      query: queryMock,
      createQueryBuilder,
    };

    const dataSource = {
      transaction: jest.fn((callback) => callback(entityManager)),
    };

    const ridesRepository = {
      find: jest.fn(),
      findOne: findOneMock,
      delete: jest.fn(),
    };

    const userRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'rider-1',
        role: UserRole.OWNER,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RidesService,
        {
          provide: getRepositoryToken(Ride),
          useValue: ridesRepository,
        },
        {
          provide: getDataSourceToken(),
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      date: '2026-06-11',
      start_time: '09:00:00',
      end_time: '10:00:00',
      primary_rider_id: 'rider-1',
      horses: ['horse-1'],
    };

    it('rejects invalid time ranges', async () => {
      await expect(
        service.create(
          {
            ...createDto,
            start_time: '10:00:00',
            end_time: '09:00:00',
          },
          authUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when horses overlap', async () => {
      horseConflictRows = [
        { name: 'Star', start_time: '09:00:00', end_time: '10:00:00' },
      ];

      try {
        await service.create(createDto, authUser);
        fail('Expected ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        const response = (error as ConflictException).getResponse() as {
          message: string;
          conflicts: { horses: { name: string }[] };
        };
        expect(response.message).toMatch(/Star/);
        expect(response.conflicts.horses).toEqual(
          expect.arrayContaining([expect.objectContaining({ name: 'Star' })]),
        );
      }
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('throws ConflictException when riders overlap', async () => {
      riderConflictRows = [
        { name: 'Alex', start_time: '09:00:00', end_time: '10:30:00' },
      ];

      try {
        await service.create(createDto, authUser);
        fail('Expected ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        const response = (error as ConflictException).getResponse() as {
          message: string;
          conflicts: { riders: { name: string }[] };
        };
        expect(response.message).toMatch(/Alex/);
        expect(response.conflicts.riders).toEqual(
          expect.arrayContaining([expect.objectContaining({ name: 'Alex' })]),
        );
      }
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('saves ride when there are no conflicts', async () => {
      const ride = await service.create(createDto, authUser);

      expect(queryMock).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
      expect(ride).toMatchObject({
        date: '2026-06-11',
        start_time: '09:00:00',
        end_time: '10:00:00',
      });
    });
  });

  describe('update', () => {
    const existingRide = {
      id: 'ride-1',
      date: '2026-06-11',
      start_time: '09:00:00',
      end_time: '10:00:00',
      primary_rider: { id: 'rider-1', name: 'Alex' },
      additional_riders: [],
      horses: [{ id: 'horse-1', name: 'Star' }],
    };

    beforeEach(() => {
      findOneMock.mockResolvedValue(existingRide);
    });

    it('allows comment-only updates without conflicts', async () => {
      const ride = await service.update('ride-1', { comments: 'Updated note' }, authUser);

      expect(saveMock).toHaveBeenCalled();
      expect(ride).toEqual({ id: 'ride-1', comments: 'Updated' });
    });

    it('throws ConflictException when updated slot overlaps another ride', async () => {
      horseConflictRows = [
        { name: 'Brownie', start_time: '09:30:00', end_time: '11:00:00' },
      ];

      await expect(
        service.update(
          'ride-1',
          {
            end_time: '11:00:00',
          },
          authUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
