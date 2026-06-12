import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TreatmentsService } from './treatments.service';
import { Treatment } from './entities/treatment.entity';
import { Horse } from 'src/horses/entities/horse.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';
import { SHOEING_TREATMENT_NAME } from './treatment.constants';

const authUser = {
  userId: 'user-1',
  name: 'Staff',
  role: UserRole.OWNER,
};

describe('TreatmentsService', () => {
  let service: TreatmentsService;

  const shoeingDate = new Date('2026-03-15');

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

  const treatmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    delete: jest.fn(),
  };

  const horseRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentsService,
        { provide: getRepositoryToken(Treatment), useValue: treatmentRepository },
        { provide: getRepositoryToken(Horse), useValue: horseRepository },
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<TreatmentsService>(TreatmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updates last_shoeing_date for all horses when completing a Shoeing treatment', async () => {
    const completedShoeing = { ...incompleteShoeing, is_complete: true };

    treatmentRepository.findOne
      .mockResolvedValueOnce(incompleteShoeing)
      .mockResolvedValueOnce(completedShoeing)
      .mockResolvedValueOnce(completedShoeing);
    treatmentRepository.preload.mockResolvedValue(completedShoeing);
    treatmentRepository.save.mockResolvedValue(completedShoeing);

    await service.update('treatment-1', { is_complete: true }, authUser);

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

    treatmentRepository.findOne
      .mockResolvedValueOnce(incompletePhysio)
      .mockResolvedValueOnce(completedPhysio);
    treatmentRepository.preload.mockResolvedValue(completedPhysio);
    treatmentRepository.save.mockResolvedValue(completedPhysio);

    await service.update('treatment-2', { is_complete: true }, authUser);

    expect(horseRepository.save).not.toHaveBeenCalled();
  });

  it('does not update horses when treatment is already complete', async () => {
    const alreadyComplete = { ...incompleteShoeing, is_complete: true };

    treatmentRepository.findOne
      .mockResolvedValueOnce(alreadyComplete)
      .mockResolvedValueOnce(alreadyComplete);
    treatmentRepository.preload.mockResolvedValue(alreadyComplete);
    treatmentRepository.save.mockResolvedValue(alreadyComplete);

    await service.update('treatment-1', { is_complete: true }, authUser);

    expect(horseRepository.save).not.toHaveBeenCalled();
  });
});
