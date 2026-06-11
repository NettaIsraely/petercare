import { PartialType } from '@nestjs/mapped-types';
import { CreateFeedingDto } from './create-feeding.dto';
import { FeedingStatus } from '../entities/feeding.entity';

export class UpdateFeedingDto extends PartialType(CreateFeedingDto) {
  feeding_status?: FeedingStatus;
  notification_time?: string;
}
