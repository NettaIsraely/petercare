import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { FeedingsService } from './feedings.service';
import {
  addDaysToDateStr,
  getLocalDateString,
  getStableTimezone,
  isLocalHour,
} from '../common/timezone.util';

const ROLLING_WINDOW_DAYS = 14;

@Injectable()
export class FeedingsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(FeedingsSchedulerService.name);

  constructor(
    private readonly feedingsService: FeedingsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureRollingWindow();
    } catch (error) {
      this.logger.error('Startup rolling window backfill failed', error);
    }
  }

  @Cron('0 * * * *')
  async handleDailyShiftCreation(): Promise<void> {
    try {
      const stableTz = this.getStableTimezone();
      const nowUtc = DateTime.utc();

      if (!isLocalHour(nowUtc, stableTz, 0)) {
        return;
      }

      const todayStable = getLocalDateString(nowUtc, stableTz);
      const horizonDate = addDaysToDateStr(todayStable, ROLLING_WINDOW_DAYS);
      const created = await this.feedingsService.ensureShiftsForDate(horizonDate);

      if (created > 0) {
        this.logger.log(
          `Daily cron created ${created} feeding shift(s) for ${horizonDate}`,
        );
      }
    } catch (error) {
      this.logger.error('Daily shift creation cron failed', error);
    }
  }

  private getStableTimezone(): string {
    return getStableTimezone(this.configService);
  }

  private async ensureRollingWindow(): Promise<void> {
    const stableTz = this.getStableTimezone();
    const todayStable = getLocalDateString(DateTime.utc(), stableTz);
    let totalCreated = 0;

    for (let offset = 0; offset < ROLLING_WINDOW_DAYS; offset += 1) {
      const dateStr = addDaysToDateStr(todayStable, offset);
      totalCreated += await this.feedingsService.ensureShiftsForDate(dateStr);
    }

    if (totalCreated > 0) {
      this.logger.log(
        `Startup backfill created ${totalCreated} feeding shift(s) for ${ROLLING_WINDOW_DAYS}-day window`,
      );
    }
  }
}
