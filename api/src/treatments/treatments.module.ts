import { Module } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { TreatmentsController } from './treatments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Treatment } from './entities/treatment.entity';
import { Horse } from 'src/horses/entities/horse.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Treatment, Horse])],
  controllers: [TreatmentsController],
  providers: [TreatmentsService],
})
export class TreatmentsModule {}
