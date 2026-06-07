import { Module } from '@nestjs/common';
import { HorsesService } from './horses.service';
import { HorsesController } from './horses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Horse } from './entities/horse.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Horse])],
  controllers: [HorsesController],
  providers: [HorsesService],
})
export class HorsesModule {}
