import { apiClient } from '../api/client';
import { CreateTreatmentPayload, Treatment, UpdateTreatmentPayload } from '../types/treatment';

export async function getAllTreatments(): Promise<Treatment[]> {
  const response = await apiClient.get<Treatment[]>('/treatments');
  return response.data;
}

export async function createTreatment(payload: CreateTreatmentPayload): Promise<Treatment> {
  const response = await apiClient.post<Treatment>('/treatments', payload);
  return response.data;
}

export async function updateTreatment(
  id: string,
  payload: UpdateTreatmentPayload
): Promise<Treatment> {
  const response = await apiClient.patch<Treatment>(`/treatments/${id}`, payload);
  return response.data;
}

export async function markTreatmentComplete(id: string): Promise<Treatment> {
  const response = await apiClient.patch<Treatment>(`/treatments/${id}`, {
    is_complete: true,
  });
  return response.data;
}
