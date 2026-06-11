import { apiClient } from '../api/client';
import { CreateTreatmentPayload, Treatment } from '../types/treatment';

export async function getAllTreatments(): Promise<Treatment[]> {
  const response = await apiClient.get<Treatment[]>('/treatments');
  return response.data;
}

export async function createTreatment(payload: CreateTreatmentPayload): Promise<Treatment> {
  const response = await apiClient.post<Treatment>('/treatments', payload);
  return response.data;
}
