export type RideConflictParams = {
  date: string;
  start_time: string;
  end_time: string;
  horseIds: string[];
  riderIds: string[];
  excludeRideId?: string;
};

export type ConflictEntry = {
  name: string;
  start_time: string;
  end_time: string;
};

export function timeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && startB < endA;
}

export function normalizeRideDate(date: string | Date): string {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date.split('T')[0];
}

function formatTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  if (minutes === 0) {
    return `${hours12}:00 ${period}`;
  }
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

function formatConflictList(entries: ConflictEntry[]): string {
  return entries
    .map((entry) => `${entry.name} (${formatTimeRange(entry.start_time, entry.end_time)})`)
    .join(', ');
}

export function buildConflictMessage(conflicts: {
  horses: ConflictEntry[];
  riders: ConflictEntry[];
}): string {
  const parts: string[] = [];

  if (conflicts.horses.length > 0) {
    parts.push(
      `The following horses are already scheduled during this time slot: ${formatConflictList(conflicts.horses)}.`,
    );
  }

  if (conflicts.riders.length > 0) {
    parts.push(
      `The following riders are already scheduled during this time slot: ${formatConflictList(conflicts.riders)}.`,
    );
  }

  parts.push('Change the times or pick other available horses.');

  return parts.join(' ');
}

export function dedupeConflictEntries(entries: ConflictEntry[]): ConflictEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.name}:${entry.start_time}:${entry.end_time}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function buildEffectiveRideConflictParams(
  existing: {
    date: string | Date;
    start_time: string;
    end_time: string;
    horses: { id: string }[];
    primary_rider: { id: string };
    additional_riders?: { id: string }[];
  },
  updateDto: {
    date?: string;
    start_time?: string;
    end_time?: string;
    horses?: string[];
    primary_rider_id?: string;
    additional_riders_ids?: string[];
  },
  rideId: string,
): RideConflictParams {
  const riderIds = [
    updateDto.primary_rider_id ?? existing.primary_rider.id,
    ...(updateDto.additional_riders_ids ??
      existing.additional_riders?.map((rider) => rider.id) ??
      []),
  ];

  return {
    date: normalizeRideDate(updateDto.date ?? existing.date),
    start_time: updateDto.start_time ?? existing.start_time,
    end_time: updateDto.end_time ?? existing.end_time,
    horseIds: updateDto.horses ?? existing.horses.map((horse) => horse.id),
    riderIds: [...new Set(riderIds)],
    excludeRideId: rideId,
  };
}

export function buildCreateRideConflictParams(dto: {
  date: string;
  start_time: string;
  end_time: string;
  horses: string[];
  primary_rider_id: string;
  additional_riders_ids?: string[];
}): RideConflictParams {
  const riderIds = [
    dto.primary_rider_id,
    ...(dto.additional_riders_ids ?? []),
  ];

  return {
    date: normalizeRideDate(dto.date),
    start_time: dto.start_time,
    end_time: dto.end_time,
    horseIds: dto.horses,
    riderIds: [...new Set(riderIds)],
  };
}
