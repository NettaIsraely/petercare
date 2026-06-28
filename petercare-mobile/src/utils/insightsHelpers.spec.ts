import { DateTime, Settings } from 'luxon';
import { DEFAULT_APP_TIMEZONE } from '../constants/timezone';
import { getCurrentWeekRange, getWeekRangeForOffset } from './insightsHelpers';

const FIXED_NOW_MS = Date.parse('2026-06-19T21:30:00.000Z');

describe('insightsHelpers (APP_TIMEZONE)', () => {
  afterEach(() => {
    Settings.now = () => Date.now();
  });

  it('uses Israel calendar week near UTC midnight when device would differ', () => {
    Settings.now = () => FIXED_NOW_MS;

    const week = getCurrentWeekRange();

    expect(week.start).toBe('2026-06-15');
    expect(week.end).toBe('2026-06-21');
  });

  it('offsets weeks in barn timezone', () => {
    Settings.now = () => FIXED_NOW_MS;

    const nextWeek = getWeekRangeForOffset(1);

    expect(nextWeek.start).toBe('2026-06-22');
    expect(nextWeek.end).toBe('2026-06-28');
  });

  it('uses configured app timezone constant', () => {
    expect(DEFAULT_APP_TIMEZONE).toBe('Asia/Jerusalem');
  });
});
