import { DateTime, Settings } from 'luxon';
import { DEFAULT_APP_TIMEZONE } from '../constants/timezone';
import {
  getNext7DayStrings,
  getRollingWeekAnchor,
  getRollingWeekDateStrings,
  isOnOrAfterToday,
  isPastShiftDeadline,
  isToday,
  recenterStaleSelectedDate,
  toDateString,
  formatTimeLabel,
  timeStringToDate,
  dateToTimeString,
  clampWeekOffset,
  MIN_WEEK_OFFSET,
  MAX_WEEK_OFFSET,
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

  it('anchors rolling week to today for offset 0 and prior week for offset -1', () => {
    Settings.now = () => FIXED_NOW_MS;
    const today = toDateString();

    expect(getRollingWeekAnchor(0)).toBe(today);
    expect(getRollingWeekDateStrings(getRollingWeekAnchor(0))).toEqual([
      '2026-06-20',
      '2026-06-21',
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
      '2026-06-25',
      '2026-06-26',
    ]);
    expect(getRollingWeekAnchor(-1)).toBe('2026-06-13');
    expect(getRollingWeekDateStrings(getRollingWeekAnchor(-1))).toEqual([
      '2026-06-13',
      '2026-06-14',
      '2026-06-15',
      '2026-06-16',
      '2026-06-17',
      '2026-06-18',
      '2026-06-19',
    ]);
  });

  it('returns empty string from formatTimeLabel for invalid input', () => {
    expect(formatTimeLabel('not-a-time')).toBe('');
  });

  it('round-trips barn wall-clock times through picker helpers', () => {
    Settings.now = () => FIXED_NOW_MS;

    const date = timeStringToDate('08:30');
    expect(dateToTimeString(date)).toBe('08:30');
  });

  it('clamps week offsets to the supported navigation range', () => {
    expect(clampWeekOffset(-100)).toBe(MIN_WEEK_OFFSET);
    expect(clampWeekOffset(100)).toBe(MAX_WEEK_OFFSET);
    expect(clampWeekOffset(3)).toBe(3);
  });
});
