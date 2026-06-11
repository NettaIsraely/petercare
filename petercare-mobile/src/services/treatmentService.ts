import { apiClient } from '../api/client';
import { Treatment } from '../types/treatment';

export async function getAllTreatments(): Promise<Treatment[]> {
  const response = await apiClient.get<Treatment[]>('/treatments');
  return response.data;
}
