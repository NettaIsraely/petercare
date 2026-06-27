import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as timezoneUtil from '../common/timezone.util';
import { TreatmentsSchedulerService } from './treatments-scheduler.service';
import { TreatmentsService } from './treatments.service';

describe('TreatmentsSchedulerService', () => {
  let service: TreatmentsSchedulerService;
  let syncDueShoeingDates: jest.Mock;

  beforeEach(async () => {
    syncDueShoeingDates = jest.fn().mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentsSchedulerService,
        {
          provide: TreatmentsService,
          useValue: { syncDueShoeingDates },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'Asia/Jerusalem') },
        },
      ],
    }).compile();

    service = module.get(TreatmentsSchedulerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('runs startup sync without checking local midnight', async () => {
    jest.spyOn(timezoneUtil, 'isLocalHour').mockReturnValue(false);

    await service.onModuleInit();

    expect(syncDueShoeingDates).toHaveBeenCalledTimes(1);
  });

  it('skips cron sync when it is not local midnight hour', async () => {
    jest.spyOn(timezoneUtil, 'isLocalHour').mockReturnValue(false);

    await service.handleShoeingDateSync();

    expect(syncDueShoeingDates).not.toHaveBeenCalled();
  });

  it('runs cron sync during local midnight hour', async () => {
    jest.spyOn(timezoneUtil, 'isLocalHour').mockReturnValue(true);
    syncDueShoeingDates.mockResolvedValue(2);

    await service.handleShoeingDateSync();

    expect(syncDueShoeingDates).toHaveBeenCalledTimes(1);
  });

  it('logs only when due Shoeing treatments were synced', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(timezoneUtil, 'isLocalHour').mockReturnValue(true);

    syncDueShoeingDates.mockResolvedValueOnce(0);
    await service.handleShoeingDateSync();
    expect(logSpy).not.toHaveBeenCalled();

    syncDueShoeingDates.mockResolvedValueOnce(2);
    await service.handleShoeingDateSync();
    expect(logSpy).toHaveBeenCalledWith(
      'Synced last_shoeing_date for 2 due Shoeing treatment(s) (cron)',
    );
  });
});
