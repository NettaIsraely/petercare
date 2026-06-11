import { apiClient } from '../api/client';
import { UserSummary } from '../types/user';

export async function getAllUsers(): Promise<UserSummary[]> {
  const response = await apiClient.get<UserSummary[]>('/users');
  return response.data;
}

export async function getUserById(id: string): Promise<UserSummary> {
  const response = await apiClient.get<UserSummary>(`/users/${id}`);
  return response.data;
}
