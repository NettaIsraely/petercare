import { Test, TestingModule } from '@nestjs/testing';
import { HorsesController } from './horses.controller';
import { HorsesService } from './horses.service';

describe('HorsesController', () => {
  let controller: HorsesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HorsesController],
      providers: [HorsesService],
    }).compile();

    controller = module.get<HorsesController>(HorsesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
