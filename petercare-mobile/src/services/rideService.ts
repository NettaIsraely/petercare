import { apiClient } from '../api/client';
import { Ride } from '../types/ride';

export async function getAllRides(): Promise<Ride[]> {
  const response = await apiClient.get<Ride[]>('/rides');
  return response.data;
}
