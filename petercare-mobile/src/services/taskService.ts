import { apiClient } from '../api/client';
import { CreateTaskPayload, Task } from '../types/task';

export async function getAllTasks(): Promise<Task[]> {
  const response = await apiClient.get<Task[]>('/tasks');
  return response.data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const response = await apiClient.post<Task>('/tasks', payload);
  return response.data;
}

export async function claimTask(id: string): Promise<Task> {
  const response = await apiClient.patch<Task>(`/tasks/${id}/claim`);
  return response.data;
}

export async function markTaskComplete(id: string): Promise<Task> {
  const response = await apiClient.patch<Task>(`/tasks/${id}`, {
    is_complete: true,
  });
  return response.data;
}
