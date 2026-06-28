import { DateTime, Settings } from 'luxon';
import { DEFAULT_APP_TIMEZONE } from '../constants/timezone';
import {
  getNext7DayStrings,
  isOnOrAfterToday,
  isPastShiftDeadline,
  isToday,
  recenterStaleSelectedDate,
  toDateString,
} from './dateHelpers';

const FIXED_NOW_MS = Date.parse('2026-06-19T21:30:00.000Z');

describe('dateHelpers (APP_TIMEZONE)', () => {
  afterEach(() => {
    Settings.now = () => Date.now();
  });

  it('uses Israel calendar date near UTC midnight when device would differ', () => {
    Settings.now = () => FIXED_NOW_MS;

    expect(toDateString()).toBe('2026-06-20');
    expect(isToday('2026-06-20')).toBe(true);
    expect(isToday('2026-06-19')).toBe(false);
  });

  it('anchors rolling windows to Israel today', () => {
    Settings.now = () => FIXED_NOW_MS;

    expect(getNext7DayStrings()).toEqual([
      '2026-06-20',
      '2026-06-21',
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
      '2026-06-25',
      '2026-06-26',
    ]);
  });

  it('compares on-or-after-today using Israel calendar', () => {
    Settings.now = () => FIXED_NOW_MS;

    expect(isOnOrAfterToday('2026-06-20')).toBe(true);
    expect(isOnOrAfterToday('2026-06-19')).toBe(false);
  });

  it('evaluates shift deadlines in Israel time', () => {
    Settings.now = () => Date.parse('2026-06-20T04:30:00.000Z');

    expect(isPastShiftDeadline('2026-06-20', 'MORNING', '08:00:00', '18:00:00')).toBe(
      false,
    );

    Settings.now = () => Date.parse('2026-06-20T05:01:00.000Z');

    expect(isPastShiftDeadline('2026-06-20', 'MORNING', '08:00:00', '18:00:00')).toBe(
      true,
    );
  });

  it('uses configured app timezone constant', () => {
    expect(DEFAULT_APP_TIMEZONE).toBe('Asia/Jerusalem');
  });

  it('recenters stale selected dates to today in barn timezone', () => {
    Settings.now = () => FIXED_NOW_MS;
    const today = toDateString();

    expect(recenterStaleSelectedDate('2026-06-18', new Date(FIXED_NOW_MS))).toBe(today);
    expect(recenterStaleSelectedDate(today, new Date(FIXED_NOW_MS))).toBe(today);
    expect(recenterStaleSelectedDate('2026-06-21', new Date(FIXED_NOW_MS))).toBe('2026-06-21');
  });
});
