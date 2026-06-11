import { apiClient } from '../api/client';
import { UpdateUserPayload, UserSummary } from '../types/user';

export async function getAllUsers(): Promise<UserSummary[]> {
  const response = await apiClient.get<UserSummary[]>('/users');
  return response.data;
}

export async function getUserById(id: string): Promise<UserSummary> {
  const response = await apiClient.get<UserSummary>(`/users/${id}`);
  return response.data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<UserSummary> {
  const response = await apiClient.patch<UserSummary>(`/users/${id}`, payload);
  return response.data;
}
