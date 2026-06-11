import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notifications.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
    TypeOrmModule.forFeature([User]),
    ConfigModule
  ],
  providers: [NotificationProcessor],
  exports: [BullModule],
})
export class QueueModule {}