import { Module } from '@nestjs/common';
import { HorsesService } from './horses.service';
import { HorsesController } from './horses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Horse } from './entities/horse.entity';
import { TreatmentsModule } from '../treatments/treatments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Horse]), TreatmentsModule],
  controllers: [HorsesController],
  providers: [HorsesService],
})
export class HorsesModule {}
