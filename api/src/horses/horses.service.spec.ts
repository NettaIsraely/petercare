import { Test, TestingModule } from '@nestjs/testing';
import { HorsesService } from './horses.service';

describe('HorsesService', () => {
  let service: HorsesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HorsesService],
    }).compile();

    service = module.get<HorsesService>(HorsesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
