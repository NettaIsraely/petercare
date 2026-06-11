import { DateTime } from 'luxon';
import {
  addDaysToDateStr,
  getLocalDateString,
  getLocalHour,
  isLocalHour,
  localTimeOnDateToUtc,
} from './timezone.util';

describe('timezone.util', () => {
  describe('Asia/Jerusalem DST boundaries', () => {
    it('converts standard-time morning alert to UTC (UTC+2)', () => {
      const alertUtc = localTimeOnDateToUtc(
        '2025-01-15',
        '08:00:00',
        'Asia/Jerusalem',
      );
      expect(alertUtc.toISO()).toBe('2025-01-15T06:00:00.000Z');
    });

    it('converts daylight-time morning alert to UTC (UTC+3)', () => {
      const alertUtc = localTimeOnDateToUtc(
        '2025-07-15',
        '08:00:00',
        'Asia/Jerusalem',
      );
      expect(alertUtc.toISO()).toBe('2025-07-15T05:00:00.000Z');
    });

    it('detects local hour 22:00 in Jerusalem during standard time', () => {
      const utcNow = DateTime.fromISO('2025-01-15T20:00:00.000Z', {
        zone: 'utc',
      });
      expect(getLocalHour(utcNow, 'Asia/Jerusalem')).toBe(22);
      expect(isLocalHour(utcNow, 'Asia/Jerusalem', 22)).toBe(true);
    });

    it('detects local hour 22:00 in Jerusalem during daylight time', () => {
      const utcNow = DateTime.fromISO('2025-07-15T19:00:00.000Z', {
        zone: 'utc',
      });
      expect(getLocalHour(utcNow, 'Asia/Jerusalem')).toBe(22);
      expect(isLocalHour(utcNow, 'Asia/Jerusalem', 22)).toBe(true);
    });
  });

  describe('America/New_York DST boundaries', () => {
    it('converts standard-time morning alert to UTC (UTC-5)', () => {
      const alertUtc = localTimeOnDateToUtc(
        '2025-01-15',
        '08:00:00',
        'America/New_York',
      );
      expect(alertUtc.toISO()).toBe('2025-01-15T13:00:00.000Z');
    });

    it('converts daylight-time morning alert to UTC (UTC-4)', () => {
      const alertUtc = localTimeOnDateToUtc(
        '2025-07-15',
        '08:00:00',
        'America/New_York',
      );
      expect(alertUtc.toISO()).toBe('2025-07-15T12:00:00.000Z');
    });

    it('detects local hour 22:00 in New York during daylight time', () => {
      const utcNow = DateTime.fromISO('2025-07-16T02:00:00.000Z', {
        zone: 'utc',
      });
      expect(getLocalHour(utcNow, 'America/New_York')).toBe(22);
      expect(isLocalHour(utcNow, 'America/New_York', 22)).toBe(true);
    });
  });

  describe('calendar date helpers', () => {
    it('adds days across month boundaries', () => {
      expect(addDaysToDateStr('2025-01-31', 1)).toBe('2025-02-01');
    });

    it('resolves local date string from UTC instant', () => {
      const utcNow = DateTime.fromISO('2025-07-15T21:30:00.000Z', {
        zone: 'utc',
      });
      expect(getLocalDateString(utcNow, 'Asia/Jerusalem')).toBe('2025-07-16');
    });
  });
});
