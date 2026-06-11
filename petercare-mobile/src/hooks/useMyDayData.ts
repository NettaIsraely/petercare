import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as feedingService from '../services/feedingService';
import * as taskService from '../services/taskService';
import * as rideService from '../services/rideService';
import * as treatmentService from '../services/treatmentService';
import * as userService from '../services/userService';
import { MyDayData, TimelineEvent } from '../types/events';
import { Feeding } from '../types/feeding';
import { Task } from '../types/task';
import { Ride } from '../types/ride';
import { Treatment } from '../types/treatment';
import { UserSummary } from '../types/user';
import { completingKey } from '../utils/completionKeys';
import { computeMyDay, mergeUserAlertTimes } from '../utils/myDayHelpers';

const EMPTY_MY_DAY: MyDayData = {
  summaryCounts: { feedings: 0, rides: 0, tasks: 0 },
  unassignedFeedings: [],
  overdueFeedings: [],
  itinerary: [],
  openTasks: [],
};

interface RawData {
  feedings: Feeding[];
  tasks: Task[];
  rides: Ride[];
  treatments: Treatment[];
  profile?: UserSummary;
}

export function useMyDayData() {
  const { user } = useAuth();
  const [myDay, setMyDay] = useState<MyDayData>(EMPTY_MY_DAY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [volunteeringId, setVolunteeringId] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [alertTimes, setAlertTimes] = useState<{ morningTime?: string; eveningTime?: string }>({});

  const applyRawData = useCallback(
    (raw: RawData) => {
      if (!user) {
        setMyDay(EMPTY_MY_DAY);
        return;
      }

      const times = mergeUserAlertTimes(raw.profile);
      setAlertTimes(times);
      setMyDay(
        computeMyDay(user.userId, raw.feedings, raw.tasks, raw.rides, raw.treatments, times)
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
        const [feedings, tasks, rides, treatments, profile] = await Promise.all([
          feedingService.getAllFeedings(),
          taskService.getAllTasks(),
          rideService.getAllRides(),
          treatmentService.getAllTreatments(),
          userService.getUserById(user.userId).catch(() => undefined),
        ]);

        applyRawData({ feedings, tasks, rides, treatments, profile });
      } catch (error) {
        console.error('Failed to load My Day data:', error);
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

  const markEventComplete = useCallback(
    async (event: TimelineEvent) => {
      if (event.kind !== 'feeding' && event.kind !== 'task') {
        return;
      }

      const key = completingKey(event.kind, event.data.id);
      setCompletingIds((prev) => new Set(prev).add(key));
      try {
        if (event.kind === 'feeding') {
          await feedingService.markFeedingComplete(event.data.id);
        } else {
          await taskService.markTaskComplete(event.data.id);
        }
        await refresh(true);
      } catch (error) {
        console.error(`Failed to mark ${event.kind} complete:`, error);
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

  return {
    myDay,
    loading,
    refreshing,
    alertTimes,
    volunteeringId,
    completingIds,
    refresh,
    volunteerForFeeding,
    markEventComplete,
  };
}
