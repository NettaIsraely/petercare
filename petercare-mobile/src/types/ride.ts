import { Horse } from './horse';
import { UserSummary } from './user';

export interface Ride {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  primary_rider: UserSummary;
  additional_riders?: UserSummary[];
  horses: Horse[];
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRidePayload {
  date: string;
  start_time: string;
  end_time: string;
  primary_rider_id: string;
  horses: string[];
  additional_riders_ids?: string[];
  comments?: string;
}

export interface UpdateRidePayload {
  date?: string;
  start_time?: string;
  end_time?: string;
  primary_rider_id?: string;
  horses?: string[];
  additional_riders_ids?: string[];
  comments?: string;
}

export function filterAdditionalRiderIds(
  primaryRiderId: string,
  additionalRiderIds: string[],
): string[] {
  return additionalRiderIds.filter((id) => id !== primaryRiderId);
}

export function getDisplayAdditionalRiders(ride: Ride): UserSummary[] {
  return (ride.additional_riders ?? []).filter(
    (rider) => rider.id !== ride.primary_rider.id,
  );
}

export function getOtherRideRiderNames(ride: Ride, currentUserId?: string): string[] {
  const names: string[] = [];
  if (ride.primary_rider.id !== currentUserId) {
    names.push(ride.primary_rider.name);
  }
  for (const rider of getDisplayAdditionalRiders(ride)) {
    if (rider.id !== currentUserId) {
      names.push(rider.name);
    }
  }
  return names;
}
