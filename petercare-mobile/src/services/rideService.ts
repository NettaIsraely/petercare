import { apiClient } from '../api/client';
import { CreateRidePayload, Ride, UpdateRidePayload } from '../types/ride';

export async function getAllRides(): Promise<Ride[]> {
  const response = await apiClient.get<Ride[]>('/rides');
  return response.data;
}

export async function createRide(payload: CreateRidePayload): Promise<Ride> {
  const response = await apiClient.post<Ride>('/rides', payload);
  return response.data;
}

export async function updateRide(id: string, payload: UpdateRidePayload): Promise<Ride> {
  const response = await apiClient.patch<Ride>(`/rides/${id}`, payload);
  return response.data;
}

export async function deleteRide(id: string): Promise<void> {
  await apiClient.delete(`/rides/${id}`);
}
