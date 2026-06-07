import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentsController } from './treatments.controller';
import { TreatmentsService } from './treatments.service';

describe('TreatmentsController', () => {
  let controller: TreatmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreatmentsController],
      providers: [TreatmentsService],
    }).compile();

    controller = module.get<TreatmentsController>(TreatmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
