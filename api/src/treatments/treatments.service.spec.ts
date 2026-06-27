import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { TreatmentsService } from './treatments.service';
import { Treatment } from './entities/treatment.entity';
import { Horse } from 'src/horses/entities/horse.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';
import { SHOEING_TREATMENT_NAME } from './treatment.constants';
import { EventNotificationsService } from '../notifications/event-notifications.service';
import { DEFAULT_STABLE_TIMEZONE, getLocalDateString } from '../common/timezone.util';

const eventNotificationsMock = {
  notifyEventModified: jest.fn(),
  notifyRideJoined: jest.fn(),
};

const configServiceMock = {
  get: jest.fn(),
};

const authUser = {
  userId: 'user-1',
  name: 'Staff',
  role: UserRole.OWNER,
};

describe('TreatmentsService', () => {
  let service: TreatmentsService;

  const shoeingDate = new Date('2026-03-15');
  const updatedShoeingDate = new Date('2026-04-20');
  const futureShoeingDate = new Date('2026-12-01');
  const olderShoeingDate = new Date('2026-01-01');

  const horse1: Horse = {
    id: 'horse-1',
    name: 'Star',
    color: 'brown' as Horse['color'],
    last_shoeing_date: null as unknown as Date,
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
  };

  const horse2: Horse = {
    id: 'horse-2',
    name: 'Moon',
    color: 'black' as Horse['color'],
    last_shoeing_date: null as unknown as Date,
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
  };

  const incompleteShoeing: Treatment = {
    id: 'treatment-1',
    name: SHOEING_TREATMENT_NAME,
    horses: [horse1, horse2],
    user: { id: 'user-1', name: 'Staff' } as Treatment['user'],
    date: shoeingDate,
    is_complete: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const incompletePhysio: Treatment = {
    ...incompleteShoeing,
    id: 'treatment-2',
    name: 'Physiotherapy',
  };

  let queryBuilderMock: {
    innerJoin: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    getMany: jest.Mock;
    getOne: jest.Mock;
  };

  const treatmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const horseRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    queryBuilderMock = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    };
    treatmentRepository.createQueryBuilder.mockImplementation(() => queryBuilderMock);
    treatmentRepository.findOne.mockReset();
    treatmentRepository.save.mockReset();
    treatmentRepository.preload.mockReset();
    treatmentRepository.delete.mockReset();
    horseRepository.findOne.mockReset();
    horseRepository.save.mockReset();
    incompleteShoeing.is_complete = false;
    configServiceMock.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentsService,
        { provide: getRepositoryToken(Treatment), useValue: treatmentRepository },
        { provide: getRepositoryToken(Horse), useValue: horseRepository },
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn() } },
        { provide: EventNotificationsService, useValue: eventNotificationsMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<TreatmentsService>(TreatmentsService);
  });

  function mockTreatmentFindOneSequence(...treatments: Treatment[]): void {
    for (const treatment of treatments) {
      treatmentRepository.findOne.mockResolvedValueOnce(treatment);
    }
    if (treatments.length > 0) {
      treatmentRepository.findOne.mockResolvedValue(treatments[treatments.length - 1]);
    }
  }

  function mockRecomputeLatest(latestDate: Date | string | null, horse: Horse = horse1): void {
    queryBuilderMock.getOne.mockResolvedValue(latestDate ? { date: latestDate } : null);
    horseRepository.findOne.mockResolvedValue({ ...horse });
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns completed treatments for a horse via join query', async () => {
    const completedTreatment = { ...incompletePhysio, is_complete: true };
    horseRepository.findOne.mockResolvedValue(horse1);
    queryBuilderMock.getMany.mockResolvedValue([completedTreatment]);

    const result = await service.findCompletedForHorse('horse-1');

    expect(horseRepository.findOne).toHaveBeenCalledWith({ where: { id: 'horse-1' } });
    expect(treatmentRepository.createQueryBuilder).toHaveBeenCalledWith('treatment');
    expect(queryBuilderMock.innerJoin).toHaveBeenCalledWith(
      'treatment.horses',
      'filterHorse',
      'filterHorse.id = :horseId',
      { horseId: 'horse-1' },
    );
    expect(queryBuilderMock.where).toHaveBeenCalledWith('treatment.is_complete = :complete', {
      complete: true,
    });
    expect(result).toEqual([completedTreatment]);
  });

  it('updates last_shoeing_date for all horses when completing a past Shoeing treatment', async () => {
    const completedShoeing = { ...incompleteShoeing, is_complete: true };

    mockTreatmentFindOneSequence(incompleteShoeing, completedShoeing);
    treatmentRepository.save.mockResolvedValue(completedShoeing);
    mockRecomputeLatest(shoeingDate, horse1);
    horseRepository.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === 'horse-1') {
        return Promise.resolve({ ...horse1 });
      }
      if (where.id === 'horse-2') {
        return Promise.resolve({ ...horse2 });
      }
      return Promise.resolve(null);
    });
    queryBuilderMock.getOne.mockResolvedValue({ date: shoeingDate });

    await service.update('treatment-1', { is_complete: true }, authUser);

    expect(treatmentRepository.preload).not.toHaveBeenCalled();
    expect(horseRepository.save).toHaveBeenCalledTimes(2);
    expect(horseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'horse-1', last_shoeing_date: shoeingDate }),
    );
    expect(horseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'horse-2', last_shoeing_date: shoeingDate }),
    );
  });

  it('does not update horses when completing a non-Shoeing treatment', async () => {
    const completedPhysio = { ...incompletePhysio, is_complete: true };

    mockTreatmentFindOneSequence(incompletePhysio, completedPhysio);
    treatmentRepository.save.mockResolvedValue(completedPhysio);

    await service.update('treatment-2', { is_complete: true }, authUser);

    expect(horseRepository.save).not.toHaveBeenCalled();
  });

  it('does not update horses when treatment is already complete', async () => {
    const alreadyComplete = { ...incompleteShoeing, is_complete: true };

    mockTreatmentFindOneSequence(alreadyComplete, alreadyComplete);
    treatmentRepository.save.mockResolvedValue(alreadyComplete);

    await service.update('treatment-1', { is_complete: true }, authUser);

    expect(horseRepository.save).not.toHaveBeenCalled();
  });

  it('clears last_shoeing_date when completing a future Shoeing treatment', async () => {
    const futureShoeing = {
      ...incompleteShoeing,
      id: 'treatment-future',
      date: futureShoeingDate,
    };
    const completedFutureShoeing = { ...futureShoeing, is_complete: true };

    mockTreatmentFindOneSequence(futureShoeing, completedFutureShoeing);
    treatmentRepository.save.mockResolvedValue(completedFutureShoeing);
    horseRepository.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === 'horse-1') {
        return Promise.resolve({ ...horse1 });
      }
      if (where.id === 'horse-2') {
        return Promise.resolve({ ...horse2 });
      }
      return Promise.resolve(null);
    });
    queryBuilderMock.getOne.mockResolvedValue(null);

    await service.update('treatment-future', { is_complete: true }, authUser);

    expect(horseRepository.save).toHaveBeenCalledTimes(2);
    expect(horseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'horse-1', last_shoeing_date: null }),
    );
  });

  it('keeps latest eligible last_shoeing_date when completing an older Shoeing treatment', async () => {
    const horseWithRecentShoeing: Horse = {
      ...horse1,
      last_shoeing_date: shoeingDate,
    };
    const olderShoeing = {
      ...incompleteShoeing,
      id: 'treatment-old',
      date: olderShoeingDate,
      horses: [horseWithRecentShoeing],
    };
    const completedOlderShoeing = { ...olderShoeing, is_complete: true };

    mockTreatmentFindOneSequence(olderShoeing, completedOlderShoeing);
    treatmentRepository.save.mockResolvedValue(completedOlderShoeing);
    horseRepository.findOne.mockResolvedValue({ ...horseWithRecentShoeing });
    queryBuilderMock.getOne.mockResolvedValue({ date: shoeingDate });

    await service.update('treatment-old', { is_complete: true }, authUser);

    expect(horseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'horse-1', last_shoeing_date: shoeingDate }),
    );
  });

  it('updates last_shoeing_date when editing date on a completed Shoeing treatment', async () => {
    const completedShoeing = { ...incompleteShoeing, is_complete: true };
    const updatedShoeing = { ...completedShoeing, date: updatedShoeingDate };

    mockTreatmentFindOneSequence(completedShoeing, updatedShoeing);
    treatmentRepository.preload.mockResolvedValue(updatedShoeing);
    treatmentRepository.save.mockResolvedValue(updatedShoeing);
    horseRepository.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === 'horse-1') {
        return Promise.resolve({ ...horse1 });
      }
      if (where.id === 'horse-2') {
        return Promise.resolve({ ...horse2 });
      }
      return Promise.resolve(null);
    });
    queryBuilderMock.getOne.mockResolvedValue({ date: updatedShoeingDate });

    await service.update(
      'treatment-1',
      { date: '2026-04-20' },
      authUser,
    );

    expect(horseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'horse-1', last_shoeing_date: updatedShoeingDate }),
    );
    expect(horseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'horse-2', last_shoeing_date: updatedShoeingDate }),
    );
  });

  it('lowers last_shoeing_date when the only eligible Shoeing date is moved earlier', async () => {
    const completedShoeing = { ...incompleteShoeing, is_complete: true, date: shoeingDate };
    const updatedShoeing = { ...completedShoeing, date: olderShoeingDate };

    mockTreatmentFindOneSequence(completedShoeing, updatedShoeing);
    treatmentRepository.preload.mockResolvedValue(updatedShoeing);
    treatmentRepository.save.mockResolvedValue(updatedShoeing);
    horseRepository.findOne.mockResolvedValue({ ...horse1, last_shoeing_date: shoeingDate });
    queryBuilderMock.getOne.mockResolvedValue({ date: olderShoeingDate });

    await service.update(
      'treatment-1',
      { date: '2026-01-01' },
      authUser,
    );

    expect(horseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'horse-1', last_shoeing_date: olderShoeingDate }),
    );
  });

  it('excludes future date and falls back when a completed Shoeing is moved to the future', async () => {
    const completedShoeing = { ...incompleteShoeing, is_complete: true, date: shoeingDate };
    const updatedShoeing = { ...completedShoeing, date: futureShoeingDate };

    mockTreatmentFindOneSequence(completedShoeing, updatedShoeing);
    treatmentRepository.preload.mockResolvedValue(updatedShoeing);
    treatmentRepository.save.mockResolvedValue(updatedShoeing);
    horseRepository.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === 'horse-1') {
        return Promise.resolve({ ...horse1, last_shoeing_date: shoeingDate });
      }
      if (where.id === 'horse-2') {
        return Promise.resolve({ ...horse2, last_shoeing_date: shoeingDate });
      }
      return Promise.resolve(null);
    });
    queryBuilderMock.getOne.mockResolvedValue(null);

    await service.update(
      'treatment-1',
      { date: '2026-12-01' },
      authUser,
    );

    expect(horseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'horse-1', last_shoeing_date: null }),
    );
  });

  it('recomputes when a completed Shoeing treatment is marked incomplete', async () => {
    const completedShoeing = { ...incompleteShoeing, is_complete: true };
    const incompleteAgain = { ...completedShoeing, is_complete: false };

    mockTreatmentFindOneSequence(completedShoeing, incompleteAgain);
    treatmentRepository.preload.mockResolvedValue(incompleteAgain);
    treatmentRepository.save.mockResolvedValue(incompleteAgain);
    horseRepository.findOne.mockResolvedValue({ ...horse1, last_shoeing_date: shoeingDate });
    queryBuilderMock.getOne.mockResolvedValue(null);

    await service.update('treatment-1', { is_complete: false }, authUser);

    expect(horseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'horse-1', last_shoeing_date: null }),
    );
  });

  it('recomputes horses after deleting a completed Shoeing treatment', async () => {
    const completedShoeing = { ...incompleteShoeing, is_complete: true };

    treatmentRepository.findOne.mockResolvedValue(completedShoeing);
    treatmentRepository.delete.mockResolvedValue({ affected: 1 });
    horseRepository.findOne.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === 'horse-1') {
        return Promise.resolve({ ...horse1, last_shoeing_date: shoeingDate });
      }
      if (where.id === 'horse-2') {
        return Promise.resolve({ ...horse2, last_shoeing_date: shoeingDate });
      }
      return Promise.resolve(null);
    });
    queryBuilderMock.getOne.mockResolvedValue(null);

    await service.remove('treatment-1', authUser);

    expect(treatmentRepository.delete).toHaveBeenCalledWith('treatment-1');
    expect(horseRepository.save).toHaveBeenCalledTimes(2);
  });

  it('syncs due completed Shoeing treatments for today via recompute', async () => {
    const nowUtc = DateTime.utc(2026, 6, 27, 12, 0, 0);
    const todayLocal = getLocalDateString(nowUtc, DEFAULT_STABLE_TIMEZONE);
    const dueTreatment = {
      ...incompleteShoeing,
      is_complete: true,
      date: todayLocal,
    };

    queryBuilderMock.getMany.mockResolvedValue([dueTreatment]);
    const recomputeSpy = jest
      .spyOn(service, 'recomputeLastShoeingDatesForHorses')
      .mockResolvedValue(undefined);

    const syncedCount = await service.syncDueShoeingDates(nowUtc);

    expect(syncedCount).toBe(1);
    expect(queryBuilderMock.where).toHaveBeenCalledWith('treatment.name = :name', {
      name: SHOEING_TREATMENT_NAME,
    });
    expect(queryBuilderMock.andWhere).toHaveBeenCalledWith('treatment.is_complete = :complete', {
      complete: true,
    });
    expect(recomputeSpy).toHaveBeenCalledWith(['horse-1', 'horse-2'], expect.any(Object));

    recomputeSpy.mockRestore();
  });

  it('returns zero and skips recompute when no due Shoeing treatments exist', async () => {
    const nowUtc = DateTime.utc(2026, 6, 27, 12, 0, 0);
    queryBuilderMock.getMany.mockResolvedValue([]);
    const recomputeSpy = jest
      .spyOn(service, 'recomputeLastShoeingDatesForHorses')
      .mockResolvedValue(undefined);

    const syncedCount = await service.syncDueShoeingDates(nowUtc);

    expect(syncedCount).toBe(0);
    expect(recomputeSpy).not.toHaveBeenCalled();

    recomputeSpy.mockRestore();
  });
});
