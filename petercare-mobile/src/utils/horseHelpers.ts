import { Ride } from '../types/ride';
import { Treatment } from '../types/treatment';
import { normalizeDateString, parseTimeToMinutes } from './dateHelpers';

export type HorseHistoryEntry =
  | { kind: 'ride'; data: Ride; sortKey: number }
  | { kind: 'treatment'; data: Treatment; sortKey: number };

export function filterRidesForHorse(rides: Ride[], horseId: string): Ride[] {
  return rides.filter((ride) => ride.horses.some((horse) => horse.id === horseId));
}

export function filterTreatmentsForHorse(
  treatments: Treatment[],
  horseId: string
): Treatment[] {
  return treatments.filter((treatment) => treatment.horse.id === horseId);
}

function getRideSortKey(ride: Ride): number {
  const datePart = normalizeDateString(ride.date);
  const minutes = parseTimeToMinutes(ride.start_time);
  return new Date(`${datePart}T00:00:00`).getTime() + minutes * 60 * 1000;
}

function getTreatmentSortKey(treatment: Treatment): number {
  const datePart = normalizeDateString(treatment.date);
  return new Date(`${datePart}T00:00:00`).getTime();
}

export function buildHorseHistory(
  rides: Ride[],
  treatments: Treatment[]
): HorseHistoryEntry[] {
  const entries: HorseHistoryEntry[] = [
    ...rides.map((ride) => ({
      kind: 'ride' as const,
      data: ride,
      sortKey: getRideSortKey(ride),
    })),
    ...treatments.map((treatment) => ({
      kind: 'treatment' as const,
      data: treatment,
      sortKey: getTreatmentSortKey(treatment),
    })),
  ];

  return entries.sort((a, b) => b.sortKey - a.sortKey);
}

export function formatShoeingDate(value?: string | null): string {
  if (!value) {
    return 'No shoeing date recorded';
  }

  const datePart = normalizeDateString(value);
  const date = new Date(`${datePart}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatHistoryDate(value: string): string {
  const datePart = normalizeDateString(value);
  const date = new Date(`${datePart}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
