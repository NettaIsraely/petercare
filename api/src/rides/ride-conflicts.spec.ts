import {
  buildConflictMessage,
  buildCreateRideConflictParams,
  buildEffectiveRideConflictParams,
  dedupeConflictEntries,
  normalizeAdditionalRiderIds,
  formatTimeRange,
  timeRangesOverlap,
} from './ride-conflicts';

describe('ride-conflicts', () => {
  describe('timeRangesOverlap', () => {
    it('detects partial overlap', () => {
      expect(timeRangesOverlap('09:00:00', '10:00:00', '09:30:00', '11:00:00')).toBe(true);
    });

    it('detects full containment', () => {
      expect(timeRangesOverlap('09:00:00', '12:00:00', '10:00:00', '11:00:00')).toBe(true);
    });

    it('allows back-to-back slots', () => {
      expect(timeRangesOverlap('09:00:00', '10:00:00', '10:00:00', '11:00:00')).toBe(false);
    });

    it('detects identical ranges', () => {
      expect(timeRangesOverlap('09:00:00', '10:00:00', '09:00:00', '10:00:00')).toBe(true);
    });

    it('returns false for non-overlapping ranges', () => {
      expect(timeRangesOverlap('09:00:00', '10:00:00', '10:30:00', '11:00:00')).toBe(false);
    });
  });

  describe('buildConflictMessage', () => {
    it('formats horse and rider conflicts', () => {
      const message = buildConflictMessage({
        horses: [{ name: 'Star', start_time: '09:00:00', end_time: '10:00:00' }],
        riders: [{ name: 'Alex', start_time: '09:00:00', end_time: '10:30:00' }],
      });

      expect(message).toContain('horses are already scheduled');
      expect(message).toContain('Star (9:00 AM – 10:00 AM)');
      expect(message).toContain('riders are already scheduled');
      expect(message).toContain('Alex (9:00 AM – 10:30 AM)');
      expect(message).toContain('Change the times or pick other available horses.');
    });

    it('formats horse-only conflicts', () => {
      const message = buildConflictMessage({
        horses: [{ name: 'Brownie', start_time: '09:30:00', end_time: '11:00:00' }],
        riders: [],
      });

      expect(message).toContain('Brownie (9:30 AM – 11:00 AM)');
      expect(message).not.toContain('riders are already scheduled');
    });
  });

  describe('formatTimeRange', () => {
    it('formats afternoon times', () => {
      expect(formatTimeRange('13:00:00', '14:30:00')).toBe('1:00 PM – 2:30 PM');
    });
  });

  describe('dedupeConflictEntries', () => {
    it('removes duplicate entries', () => {
      const deduped = dedupeConflictEntries([
        { name: 'Star', start_time: '09:00:00', end_time: '10:00:00' },
        { name: 'Star', start_time: '09:00:00', end_time: '10:00:00' },
        { name: 'Alex', start_time: '09:00:00', end_time: '10:00:00' },
      ]);

      expect(deduped).toHaveLength(2);
    });
  });

  describe('normalizeAdditionalRiderIds', () => {
    it('removes primary rider and duplicate ids', () => {
      expect(
        normalizeAdditionalRiderIds('rider-b', ['rider-a', 'rider-b', 'rider-a', 'rider-c']),
      ).toEqual(['rider-a', 'rider-c']);
    });

    it('returns empty array when only primary rider is provided', () => {
      expect(normalizeAdditionalRiderIds('rider-a', ['rider-a'])).toEqual([]);
    });
  });

  describe('buildCreateRideConflictParams', () => {
    it('collects unique rider ids', () => {
      const params = buildCreateRideConflictParams({
        date: '2026-06-11',
        start_time: '09:00:00',
        end_time: '10:00:00',
        horses: ['horse-1'],
        primary_rider_id: 'rider-1',
        additional_riders_ids: ['rider-2', 'rider-1'],
      });

      expect(params.riderIds).toEqual(['rider-1', 'rider-2']);
      expect(params.horseIds).toEqual(['horse-1']);
    });
  });

  describe('buildEffectiveRideConflictParams', () => {
    it('merges existing ride fields with partial updates', () => {
      const params = buildEffectiveRideConflictParams(
        {
          date: '2026-06-11',
          start_time: '09:00:00',
          end_time: '10:00:00',
          horses: [{ id: 'horse-1' }, { id: 'horse-2' }],
          primary_rider: { id: 'rider-1' },
          additional_riders: [{ id: 'rider-2' }],
        },
        { comments: 'Updated note' },
        'ride-1',
      );

      expect(params).toEqual({
        date: '2026-06-11',
        start_time: '09:00:00',
        end_time: '10:00:00',
        horseIds: ['horse-1', 'horse-2'],
        riderIds: ['rider-1', 'rider-2'],
        excludeRideId: 'ride-1',
      });
    });

    it('uses updated fields when provided', () => {
      const params = buildEffectiveRideConflictParams(
        {
          date: '2026-06-11',
          start_time: '09:00:00',
          end_time: '10:00:00',
          horses: [{ id: 'horse-1' }],
          primary_rider: { id: 'rider-1' },
        },
        {
          date: '2026-06-12',
          start_time: '11:00:00',
          end_time: '12:00:00',
          horses: ['horse-3'],
          primary_rider_id: 'rider-3',
          additional_riders_ids: ['rider-4'],
        },
        'ride-1',
      );

      expect(params.date).toBe('2026-06-12');
      expect(params.start_time).toBe('11:00:00');
      expect(params.end_time).toBe('12:00:00');
      expect(params.horseIds).toEqual(['horse-3']);
      expect(params.riderIds).toEqual(['rider-3', 'rider-4']);
    });
  });
});
