import { Module } from '@nestjs/common';
import { FeedingsService } from './feedings.service';
import { FeedingsController } from './feedings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feeding } from './entities/feeding.entity';
import { QueueModule } from 'src/queue/queue.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feeding, User]),
    QueueModule,
  ],
  controllers: [FeedingsController],
  providers: [FeedingsService],
})
export class FeedingsModule {}
