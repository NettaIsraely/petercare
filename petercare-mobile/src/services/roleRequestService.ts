import { apiClient } from '../api/client';
import { RoleRequest } from '../types/roleRequest';

export async function createRoleRequest(): Promise<RoleRequest> {
  const response = await apiClient.post<RoleRequest>('/role-requests');
  return response.data;
}

export async function getMyRoleRequest(): Promise<RoleRequest | null> {
  const response = await apiClient.get<RoleRequest | null>('/role-requests/mine');
  return response.data;
}

export async function getPendingRoleRequests(): Promise<RoleRequest[]> {
  const response = await apiClient.get<RoleRequest[]>('/role-requests/pending');
  return response.data;
}

export async function approveRoleRequest(id: string): Promise<RoleRequest> {
  const response = await apiClient.patch<RoleRequest>(`/role-requests/${id}/approve`);
  return response.data;
}

export async function denyRoleRequest(id: string): Promise<RoleRequest> {
  const response = await apiClient.patch<RoleRequest>(`/role-requests/${id}/deny`);
  return response.data;
}
