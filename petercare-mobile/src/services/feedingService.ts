import { apiClient } from '../api/client';
import { CreateFeedingPayload, Feeding } from '../types/feeding';

export async function getAllFeedings(): Promise<Feeding[]> {
  const response = await apiClient.get<Feeding[]>('/feedings');
  return response.data;
}

export async function createFeeding(payload: CreateFeedingPayload): Promise<Feeding> {
  const response = await apiClient.post<Feeding>('/feedings', payload);
  return response.data;
}

export async function markFeedingComplete(id: string): Promise<Feeding> {
  const response = await apiClient.patch<Feeding>(`/feedings/${id}`, {
    feeding_status: 'COMPLETE',
  });
  return response.data;
}

export async function volunteerForFeeding(
  id: string,
  notificationTime?: string
): Promise<Feeding> {
  const response = await apiClient.patch<Feeding>(`/feedings/${id}/volunteer`, {
    notification_time: notificationTime,
  });
  return response.data;
}
