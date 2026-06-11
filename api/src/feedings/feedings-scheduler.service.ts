import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { FeedingsService } from './feedings.service';
import {
  addDaysToDateStr,
  DEFAULT_STABLE_TIMEZONE,
  getLocalDateString,
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
    await this.ensureRollingWindow();
  }

  @Cron('5 * * * *')
  async handleDailyShiftCreation(): Promise<void> {
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
  }

  private getStableTimezone(): string {
    return (
      this.configService.get<string>('STABLE_TIMEZONE') ??
      DEFAULT_STABLE_TIMEZONE
    );
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
