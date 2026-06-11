import { formatTimeLabel } from './dateHelpers';

export type RideConflictEntry = {
  name: string;
  start_time: string;
  end_time: string;
};

export type RideConflictDetails = {
  horses: RideConflictEntry[];
  riders: RideConflictEntry[];
};

type ConflictPayload = {
  message?: string;
  conflicts?: {
    horses?: RideConflictEntry[];
    riders?: RideConflictEntry[];
  };
};

function getResponseData(err: unknown): unknown {
  return (err as { response?: { data?: unknown } })?.response?.data;
}

function getResponseStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

export function isExpectedRideSchedulingError(err: unknown): boolean {
  const status = getResponseStatus(err);
  return status === 409 || status === 400;
}

export function parseRideSchedulingConflict(err: unknown): RideConflictDetails | null {
  if (getResponseStatus(err) !== 409) {
    return null;
  }

  const data = getResponseData(err);
  if (!data || typeof data !== 'object') {
    return null;
  }

  const root = data as Record<string, unknown>;
  const nested = root.message;

  if (nested && typeof nested === 'object') {
    const payload = nested as ConflictPayload;
    if (payload.conflicts) {
      return {
        horses: payload.conflicts.horses ?? [],
        riders: payload.conflicts.riders ?? [],
      };
    }
  }

  return null;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = getResponseData(err);
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const message = (data as { message?: unknown }).message;
  if (typeof message === 'string') {
    return message;
  }

  if (message && typeof message === 'object') {
    const nestedMessage = (message as ConflictPayload).message;
    if (typeof nestedMessage === 'string') {
      return nestedMessage;
    }
  }

  return fallback;
}

export function formatConflictTimeRange(startTime: string, endTime: string): string {
  return `${formatTimeLabel(startTime)} – ${formatTimeLabel(endTime)}`;
}

export function getConflictHorseNames(conflicts: RideConflictDetails): Set<string> {
  return new Set(conflicts.horses.map((horse) => horse.name));
}
