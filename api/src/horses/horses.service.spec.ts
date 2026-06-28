import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HorsesService } from './horses.service';
import { Horse } from './entities/horse.entity';

describe('HorsesService', () => {
  let service: HorsesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HorsesService,
        { provide: getRepositoryToken(Horse), useValue: {} },
      ],
    }).compile();

    service = module.get<HorsesService>(HorsesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
