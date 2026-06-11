import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as taskService from '../services/taskService';
import * as userService from '../services/userService';
import { CreateTaskPayload, Task, UpdateTaskPayload } from '../types/task';
import { UserSummary } from '../types/user';
import { TimelineEvent } from '../types/events';
import { completingKey } from '../utils/completionKeys';

export function useTasksData() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(
    async (options?: { pull?: boolean; silent?: boolean }) => {
      if (!user) {
        return;
      }

      if (options?.pull) {
        setRefreshing(true);
      } else if (!options?.silent) {
        setLoading(true);
      }

      try {
        const [taskData, userData] = await Promise.all([
          taskService.getAllTasks(),
          userService.getAllUsers(),
        ]);
        setTasks(taskData);
        setUsers(userData);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      refresh({ silent: hasLoadedRef.current });
      hasLoadedRef.current = true;
    }, [refresh])
  );

  const createTask = useCallback(
    async (payload: CreateTaskPayload) => {
      setCreating(true);
      try {
        await taskService.createTask(payload);
        await refresh({ silent: true });
      } catch (error) {
        console.error('Failed to create task:', error);
        throw error;
      } finally {
        setCreating(false);
      }
    },
    [refresh]
  );

  const updateTask = useCallback(
    async (id: string, payload: UpdateTaskPayload) => {
      setUpdating(true);
      try {
        await taskService.updateTask(id, payload);
        await refresh({ silent: true });
      } catch (error) {
        console.error('Failed to update task:', error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [refresh]
  );

  const claimTask = useCallback(
    async (taskId: string) => {
      setClaimingId(taskId);
      try {
        await taskService.claimTask(taskId);
        await refresh({ silent: true });
      } catch (error) {
        console.error('Failed to claim task:', error);
      } finally {
        setClaimingId(null);
      }
    },
    [refresh]
  );

  const markTaskComplete = useCallback(
    async (task: Task) => {
      const key = completingKey('task', task.id);
      setCompletingIds((prev) => new Set(prev).add(key));
      try {
        await taskService.markTaskComplete(task.id);
        await refresh({ silent: true });
      } catch (error) {
        console.error('Failed to mark task complete:', error);
      } finally {
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [refresh]
  );

  const markEventComplete = useCallback(
    async (event: TimelineEvent) => {
      if (event.kind !== 'task') {
        return;
      }
      await markTaskComplete(event.data);
    },
    [markTaskComplete]
  );

  return {
    tasks,
    users,
    loading,
    refreshing,
    creating,
    updating,
    claimingId,
    completingIds,
    refresh: (isPullRefresh = false) => refresh(isPullRefresh ? { pull: true } : undefined),
    createTask,
    updateTask,
    claimTask,
    markTaskComplete,
    markEventComplete,
    currentUserId: user?.userId,
  };
}
