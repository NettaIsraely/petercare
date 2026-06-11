import { apiClient } from '../api/client';
import { CreateRidePayload, Ride } from '../types/ride';

export async function getAllRides(): Promise<Ride[]> {
  const response = await apiClient.get<Ride[]>('/rides');
  return response.data;
}

export async function createRide(payload: CreateRidePayload): Promise<Ride> {
  const response = await apiClient.post<Ride>('/rides', payload);
  return response.data;
}
