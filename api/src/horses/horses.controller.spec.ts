import { Test, TestingModule } from '@nestjs/testing';
import { HorsesController } from './horses.controller';
import { HorsesService } from './horses.service';
import { TreatmentsService } from '../treatments/treatments.service';

describe('HorsesController', () => {
  let controller: HorsesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HorsesController],
      providers: [
        { provide: HorsesService, useValue: {} },
        { provide: TreatmentsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<HorsesController>(HorsesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
