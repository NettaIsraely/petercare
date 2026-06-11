import { Module } from '@nestjs/common';
import { FeedingsService } from './feedings.service';
import { FeedingsController } from './feedings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feeding } from './entities/feeding.entity';
import { User } from 'src/users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feeding, User]),
    NotificationsModule,
  ],
  controllers: [FeedingsController],
  providers: [FeedingsService],
})
export class FeedingsModule {}
