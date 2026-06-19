import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feeding } from '../feedings/entities/feeding.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { QueueModule } from '../queue/queue.module';
import { FeedingNotificationsService } from './feeding-notifications.service';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { NotificationPreferencesService } from './notification-preferences.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feeding, Task, User]),
    QueueModule,
  ],
  providers: [
    FeedingNotificationsService,
    NotificationsSchedulerService,
    NotificationPreferencesService,
  ],
  exports: [FeedingNotificationsService, NotificationPreferencesService],
})
export class NotificationsModule {}
