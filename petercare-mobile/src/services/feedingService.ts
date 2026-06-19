import { apiClient } from '../api/client';
import { Feeding, UpdateFeedingPayload } from '../types/feeding';

export async function getAllFeedings(): Promise<Feeding[]> {
  const response = await apiClient.get<Feeding[]>('/feedings');
  return response.data;
}

export async function updateFeeding(id: string, payload: UpdateFeedingPayload): Promise<Feeding> {
  const response = await apiClient.patch<Feeding>(`/feedings/${id}`, payload);
  return response.data;
}

export async function markFeedingComplete(id: string): Promise<Feeding> {
  const response = await apiClient.patch<Feeding>(`/feedings/${id}`, {
    feeding_status: 'COMPLETE',
  });
  return response.data;
}

export async function markFeedingIncomplete(id: string): Promise<Feeding> {
  const response = await apiClient.patch<Feeding>(`/feedings/${id}`, {
    feeding_status: 'ASSIGNED',
  });
  return response.data;
}

export async function volunteerForFeeding(
  id: string,
  notificationTime?: string
): Promise<Feeding> {
  const body: { notification_time?: string } = {};
  if (notificationTime !== undefined) {
    body.notification_time = notificationTime;
  }
  const response = await apiClient.patch<Feeding>(`/feedings/${id}/volunteer`, body);
  return response.data;
}

export async function takeOverFeeding(id: string): Promise<Feeding> {
  const response = await apiClient.patch<Feeding>(`/feedings/${id}/take-over`, {});
  return response.data;
}
