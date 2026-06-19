import { Ride } from '../types/ride';
import { Treatment } from '../types/treatment';
import { normalizeDateString, parseTimeToMinutes, formatUserFacingDate } from './dateHelpers';

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
  return treatments.filter((treatment) =>
    treatment.horses.some((horse) => horse.id === horseId)
  );
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

export function buildSeparatedHorseHistory(
  rides: Ride[],
  treatments: Treatment[]
): { rides: HorseHistoryEntry[]; treatments: HorseHistoryEntry[] } {
  const rideEntries: HorseHistoryEntry[] = rides
    .map((ride) => ({
      kind: 'ride' as const,
      data: ride,
      sortKey: getRideSortKey(ride),
    }))
    .sort((a, b) => b.sortKey - a.sortKey);

  const treatmentEntries: HorseHistoryEntry[] = treatments
    .map((treatment) => ({
      kind: 'treatment' as const,
      data: treatment,
      sortKey: getTreatmentSortKey(treatment),
    }))
    .sort((a, b) => b.sortKey - a.sortKey);

  return { rides: rideEntries, treatments: treatmentEntries };
}

export function formatShoeingDate(value?: string | null): string {
  if (!value) {
    return 'No shoeing date recorded';
  }

  const datePart = normalizeDateString(value);
  return formatUserFacingDate(datePart);
}

export function formatHistoryDate(value: string): string {
  const datePart = normalizeDateString(value);
  const date = new Date(`${datePart}T00:00:00`);
  const weekday = date.toLocaleDateString('he-IL', { weekday: 'short' });
  return `${weekday}, ${formatUserFacingDate(datePart)}`;
}
