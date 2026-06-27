import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { getStableTimezone, isLocalHour } from '../common/timezone.util';
import { TreatmentsService } from './treatments.service';

@Injectable()
export class TreatmentsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(TreatmentsSchedulerService.name);

  constructor(
    private readonly treatmentsService: TreatmentsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.runShoeingDateSync('startup');
    } catch (error) {
      this.logger.error('Startup shoeing date sync failed', error);
    }
  }

  @Cron('5 * * * *')
  async handleShoeingDateSync(): Promise<void> {
    try {
      await this.runShoeingDateSync('cron');
    } catch (error) {
      this.logger.error('Shoeing date sync failed', error);
    }
  }

  private async runShoeingDateSync(trigger: 'startup' | 'cron'): Promise<void> {
    const nowUtc = DateTime.utc();
    const stableTz = getStableTimezone(this.configService);

    if (trigger === 'cron' && !isLocalHour(nowUtc, stableTz, 0)) {
      return;
    }

    const syncedCount = await this.treatmentsService.syncDueShoeingDates(nowUtc);
    if (syncedCount > 0) {
      this.logger.log(
        `Synced last_shoeing_date for ${syncedCount} due Shoeing treatment(s) (${trigger})`,
      );
    }
  }
}
