import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as feedingService from '../services/feedingService';
import * as taskService from '../services/taskService';
import * as rideService from '../services/rideService';
import * as treatmentService from '../services/treatmentService';
import * as userService from '../services/userService';
import * as horseService from '../services/horseService';
import { MyWeekData, TimelineEvent } from '../types/events';
import { Feeding, UpdateFeedingPayload } from '../types/feeding';
import { Task, UpdateTaskPayload } from '../types/task';
import { Ride, UpdateRidePayload } from '../types/ride';
import { Treatment, UpdateTreatmentPayload } from '../types/treatment';
import { Horse } from '../types/horse';
import { UserSummary } from '../types/user';
import { completingKey } from '../utils/completionKeys';
import { confirmFeedingCompletionIfNeeded } from '../utils/feedingCompletionHelpers';
import { computeMyWeek, mergeUserAlertTimes } from '../utils/myDayHelpers';
import { isEventCompleted } from '../utils/scheduleHelpers';
import { orderUsersForAssignment } from '../utils/assignableUsers';

const EMPTY_MY_WEEK: MyWeekData = {
  summaryCounts: { feedings: 0, rides: 0, tasks: 0 },
  unassignedFeedings: [],
  overdueFeedings: [],
  daySections: [],
  openTasks: [],
};

interface RawData {
  feedings: Feeding[];
  tasks: Task[];
  rides: Ride[];
  treatments: Treatment[];
  horses: Horse[];
  assignableUsers: UserSummary[];
  profile?: UserSummary;
}

export function useMyDayData() {
  const { user } = useAuth();
  const [myWeek, setMyWeek] = useState<MyWeekData>(EMPTY_MY_WEEK);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [volunteeringId, setVolunteeringId] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [alertTimes, setAlertTimes] = useState<{ morningTime?: string; eveningTime?: string }>({});

  const orderedAssignableUsers = useMemo(
    () => orderUsersForAssignment(assignableUsers, user?.userId),
    [assignableUsers, user?.userId]
  );

  const applyRawData = useCallback(
    (raw: RawData) => {
      if (!user) {
        setMyWeek(EMPTY_MY_WEEK);
        return;
      }

      const times = mergeUserAlertTimes(raw.profile);
      setAlertTimes(times);
      setHorses(raw.horses);
      setAssignableUsers(raw.assignableUsers);
      setMyWeek(
        computeMyWeek(user.userId, raw.feedings, raw.tasks, raw.rides, raw.treatments, times)
      );
    },
    [user]
  );

  const refresh = useCallback(
    async (isPullRefresh = false) => {
      if (!user) {
        return;
      }

      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [feedings, tasks, rides, treatments, horsesData, usersData, profile] =
          await Promise.all([
            feedingService.getAllFeedings(),
            taskService.getAllTasks(),
            rideService.getAllRides(),
            treatmentService.getAllTreatments(),
            horseService.getAllHorses(),
            userService.getAssignableUsers(),
            userService.getUserById(user.userId).catch(() => undefined),
          ]);

        applyRawData({
          feedings,
          tasks,
          rides,
          treatments,
          horses: horsesData,
          assignableUsers: usersData,
          profile,
        });
      } catch (error) {
        console.error('Failed to load My Schedule data:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, applyRawData]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const volunteerForFeeding = useCallback(
    async (feedingId: string) => {
      setVolunteeringId(feedingId);
      try {
        await feedingService.volunteerForFeeding(feedingId);
        await refresh(true);
      } catch (error) {
        console.error('Failed to volunteer for feeding:', error);
      } finally {
        setVolunteeringId(null);
      }
    },
    [refresh]
  );

  const toggleEventComplete = useCallback(
    async (event: TimelineEvent) => {
      if (event.kind !== 'feeding' && event.kind !== 'task' && event.kind !== 'treatment') {
        return;
      }

      const isComplete = isEventCompleted(event);

      if (!isComplete && event.kind === 'feeding') {
        const confirmed = await confirmFeedingCompletionIfNeeded(event.data);
        if (!confirmed) {
          return;
        }
      }

      const key = completingKey(event.kind, event.data.id);
      setCompletingIds((prev) => new Set(prev).add(key));
      try {
        if (event.kind === 'feeding') {
          if (isComplete) {
            await feedingService.markFeedingIncomplete(event.data.id);
          } else {
            await feedingService.markFeedingComplete(event.data.id);
          }
        } else if (event.kind === 'task') {
          if (isComplete) {
            await taskService.updateTask(event.data.id, { is_complete: false });
          } else {
            await taskService.markTaskComplete(event.data.id);
          }
        } else if (isComplete) {
          await treatmentService.updateTreatment(event.data.id, { is_complete: false });
        } else {
          await treatmentService.markTreatmentComplete(event.data.id);
        }
        await refresh(true);
      } catch (error) {
        console.error(`Failed to toggle ${event.kind} completion:`, error);
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

  const updateFeeding = useCallback(
    async (id: string, payload: UpdateFeedingPayload) => {
      setUpdating(true);
      try {
        await feedingService.updateFeeding(id, payload);
        await refresh(true);
      } catch (error) {
        console.error('Failed to update feeding:', error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [refresh]
  );

  const updateTask = useCallback(
    async (id: string, payload: UpdateTaskPayload) => {
      setUpdating(true);
      try {
        await taskService.updateTask(id, payload);
        await refresh(true);
      } catch (error) {
        console.error('Failed to update task:', error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [refresh]
  );

  const updateRide = useCallback(
    async (id: string, payload: UpdateRidePayload) => {
      setUpdating(true);
      try {
        await rideService.updateRide(id, payload);
        await refresh(true);
      } catch (error) {
        console.error('Failed to update ride:', error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [refresh]
  );

  const updateTreatment = useCallback(
    async (id: string, payload: UpdateTreatmentPayload) => {
      setUpdating(true);
      try {
        await treatmentService.updateTreatment(id, payload);
        await refresh(true);
      } catch (error) {
        console.error('Failed to update treatment:', error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [refresh]
  );

  return {
    myWeek,
    horses,
    assignableUsers: orderedAssignableUsers,
    loading,
    refreshing,
    updating,
    alertTimes,
    volunteeringId,
    completingIds,
    refresh,
    volunteerForFeeding,
    toggleEventComplete,
    updateFeeding,
    updateTask,
    updateRide,
    updateTreatment,
  };
}
