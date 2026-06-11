import { apiClient } from '../api/client';
import { Horse } from '../types/horse';

export async function getAllHorses(): Promise<Horse[]> {
  const response = await apiClient.get<Horse[]>('/horses');
  return response.data;
}
