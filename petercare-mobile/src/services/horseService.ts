import { apiClient } from '../api/client';
import { CreateHorsePayload, Horse, UpdateHorsePayload } from '../types/horse';
import { Treatment } from '../types/treatment';

export async function getAllHorses(): Promise<Horse[]> {
  const response = await apiClient.get<Horse[]>('/horses');
  return response.data;
}

export async function getHorse(id: string): Promise<Horse> {
  const response = await apiClient.get<Horse>(`/horses/${id}`);
  return response.data;
}

export async function getHorseTreatments(horseId: string): Promise<Treatment[]> {
  const response = await apiClient.get<Treatment[]>(`/horses/${horseId}/treatments`);
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
