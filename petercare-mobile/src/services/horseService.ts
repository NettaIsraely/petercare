import { apiClient } from '../api/client';
import { CreateHorsePayload, Horse, UpdateHorsePayload } from '../types/horse';

export async function getAllHorses(): Promise<Horse[]> {
  const response = await apiClient.get<Horse[]>('/horses');
  return response.data;
}

export async function getHorse(id: string): Promise<Horse> {
  const response = await apiClient.get<Horse>(`/horses/${id}`);
  return response.data;
}

export async function createHorse(payload: CreateHorsePayload): Promise<Horse> {
  const response = await apiClient.post<Horse>('/horses', payload);
  return response.data;
}

export async function updateHorse(id: string, payload: UpdateHorsePayload): Promise<Horse> {
  const response = await apiClient.patch<Horse>(`/horses/${id}`, payload);
  return response.data;
}
