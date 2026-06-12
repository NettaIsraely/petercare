import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserProfileColor, UserRole } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<
    Pick<
      Repository<User>,
      'find' | 'findOne' | 'create' | 'save' | 'preload' | 'createQueryBuilder' | 'manager'
    >
  >;

  const owner: User = {
    id: 'owner-id',
    name: 'Owner',
    email: 'owner@test.com',
    password_hash: 'hash',
    role: UserRole.OWNER,
    display_order: 0,
    morning_alert_time: '08:00:00',
    evening_alert_time: '18:00:00',
    timezone: 'Asia/Jerusalem',
    profile_color: UserProfileColor.BLUE,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  };

  const caregiver: User = {
    ...owner,
    id: 'caregiver-id',
    name: 'Caregiver',
    email: 'caregiver@test.com',
    role: UserRole.CAREGIVER,
    display_order: 0,
    created_at: new Date('2026-01-02'),
  };

  const guest: User = {
    ...owner,
    id: 'guest-id',
    name: 'Guest',
    email: 'guest@test.com',
    role: UserRole.GUEST,
    display_order: 0,
    created_at: new Date('2026-01-03'),
  };

  beforeEach(async () => {
    userRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value) => value as User),
      save: jest.fn(async (value) => value as User),
      preload: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        transaction: jest.fn(async (callback) => callback({ update: jest.fn() })),
      } as unknown as Repository<User>['manager'],
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('returns assignable users without guests in display order', async () => {
    userRepository.find
      .mockResolvedValueOnce([owner, caregiver])
      .mockResolvedValueOnce([{ ...owner, display_order: 1 }, { ...caregiver, display_order: 2 }]);

    const result = await service.findAssignable();

    expect(result).toHaveLength(2);
    expect(result.map((user) => user.id)).toEqual(['owner-id', 'caregiver-id']);
    expect(result.every((user) => user.role !== UserRole.GUEST)).toBe(true);
  });

  it('assigns the next display order when creating assignable users', async () => {
    userRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ max: '2' }),
    } as never);
    userRepository.save.mockImplementation(async (value) => value as User);

    await service.create({
      name: 'New Caregiver',
      email: 'new@test.com',
      password: 'secret',
      role: UserRole.CAREGIVER,
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: UserRole.CAREGIVER,
        display_order: 3,
        profile_color: expect.any(String),
      }),
    );
  });

  it('rejects duplicate IDs when updating display order', async () => {
    await expect(
      service.updateDisplayOrder(['owner-id', 'owner-id']),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects incomplete display order updates', async () => {
    userRepository.find.mockResolvedValueOnce([owner, caregiver]);

    await expect(service.updateDisplayOrder(['owner-id'])).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects guest IDs in display order updates', async () => {
    userRepository.find.mockResolvedValueOnce([owner, caregiver]);

    await expect(
      service.updateDisplayOrder(['owner-id', 'guest-id']),
    ).rejects.toThrow(BadRequestException);
  });

  it('assigns display order when promoting a user to caregiver', async () => {
    userRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ max: '2' }),
    } as never);

    const promotedGuest = { ...guest, role: UserRole.CAREGIVER };
    userRepository.save.mockResolvedValueOnce({
      ...promotedGuest,
      display_order: 3,
    });

    await service.assignDisplayOrderForRole(promotedGuest);

    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'guest-id',
        display_order: 3,
      }),
    );
  });

  it('initializes display order for existing staff on module init', async () => {
    const uninitializedOwner = { ...owner, display_order: 0 };
    const uninitializedCaregiver = { ...caregiver, display_order: 0 };
    userRepository.find
      .mockResolvedValueOnce([uninitializedOwner, uninitializedCaregiver])
      .mockResolvedValueOnce([]);

    await service.onModuleInit();

    expect(userRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'owner-id', display_order: 1 }),
      expect.objectContaining({ id: 'caregiver-id', display_order: 2 }),
    ]);
  });

  it('backfills profile colors for users without one on module init', async () => {
    const userWithoutColor = { ...guest, profile_color: null };
    userRepository.find
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([userWithoutColor]);

    await service.onModuleInit();

    expect(userRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'guest-id',
        profile_color: expect.any(String),
      }),
    ]);
  });

  it('accepts a valid profile color update', async () => {
    userRepository.preload = jest.fn().mockResolvedValue({
      ...owner,
      profile_color: UserProfileColor.GREEN,
    });
    userRepository.save.mockResolvedValue({
      ...owner,
      profile_color: UserProfileColor.GREEN,
    });

    const result = await service.update('owner-id', {
      profile_color: UserProfileColor.GREEN,
    });

    expect(result.profile_color).toBe(UserProfileColor.GREEN);
  });

  it('rejects an invalid profile color update', async () => {
    await expect(
      service.update('owner-id', { profile_color: 'pink' as UserProfileColor }),
    ).rejects.toThrow(BadRequestException);
  });
});
