import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as feedingService from '../services/feedingService';
import * as taskService from '../services/taskService';
import * as rideService from '../services/rideService';
import * as treatmentService from '../services/treatmentService';
import * as userService from '../services/userService';
import * as horseService from '../services/horseService';
import { CreateFeedingPayload, Feeding } from '../types/feeding';
import { CreateTaskPayload, Task } from '../types/task';
import { CreateRidePayload, Ride } from '../types/ride';
import { CreateTreatmentPayload, Treatment } from '../types/treatment';
import { Horse } from '../types/horse';
import { UserSummary } from '../types/user';
import { ScheduleSectionData, TimelineEvent } from '../types/events';
import {
  buildCalendarMarkedDates,
  buildScheduleListSections,
  CALENDAR_FEEDING_ALERT_TIMES,
  getEventsForDate,
  getEventsForWeek,
} from '../utils/scheduleHelpers';
import { toDateString } from '../utils/dateHelpers';
import { completingKey } from '../utils/completionKeys';

interface RawScheduleData {
  feedings: Feeding[];
  tasks: Task[];
  rides: Ride[];
  treatments: Treatment[];
  horses: Horse[];
  users: UserSummary[];
  profile?: UserSummary;
}

const EMPTY_SECTIONS: ScheduleSectionData = {
  feedings: [],
  rides: [],
  treatments: [],
  tasksWithDeadlines: [],
  datelessTasks: [],
};

export function useScheduleData() {
  const { user } = useAuth();
  const [raw, setRaw] = useState<RawScheduleData>({
    feedings: [],
    tasks: [],
    rides: [],
    treatments: [],
    horses: [],
    users: [],
  });
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [volunteeringId, setVolunteeringId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const alertTimes = useMemo(() => CALENDAR_FEEDING_ALERT_TIMES, []);

  const listSections = useMemo(
    () =>
      buildScheduleListSections(
        raw.feedings,
        raw.tasks,
        raw.rides,
        raw.treatments,
        raw.profile
      ),
    [raw]
  );

  const markedDates = useMemo(
    () =>
      buildCalendarMarkedDates(
        raw.feedings,
        raw.tasks,
        raw.rides,
        raw.treatments,
        selectedDate
      ),
    [raw, selectedDate]
  );

  const selectedDateEvents = useMemo(
    () =>
      getEventsForDate(
        selectedDate,
        raw.feedings,
        raw.tasks,
        raw.rides,
        raw.treatments,
        raw.profile
      ),
    [raw, selectedDate]
  );

  const weekEvents = useMemo(
    () =>
      getEventsForWeek(
        selectedDate,
        raw.feedings,
        raw.tasks,
        raw.rides,
        raw.treatments,
        raw.profile
      ),
    [raw, selectedDate]
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
        const [feedings, tasks, rides, treatments, horses, users, profile] =
          await Promise.all([
            feedingService.getAllFeedings(),
            taskService.getAllTasks(),
            rideService.getAllRides(),
            treatmentService.getAllTreatments(),
            horseService.getAllHorses(),
            userService.getAllUsers(),
            userService.getUserById(user.userId).catch(() => undefined),
          ]);

        setRaw({ feedings, tasks, rides, treatments, horses, users, profile });
      } catch (error) {
        console.error('Failed to load schedule data:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const volunteerForFeeding = useCallback(
    async (feedingId: string, notificationTime?: string) => {
      setVolunteeringId(feedingId);
      try {
        await feedingService.volunteerForFeeding(feedingId, notificationTime);
        await refresh(true);
      } catch (error) {
        console.error('Failed to volunteer for feeding:', error);
      } finally {
        setVolunteeringId(null);
      }
    },
    [refresh]
  );

  const claimTask = useCallback(
    async (taskId: string) => {
      setClaimingId(taskId);
      try {
        await taskService.claimTask(taskId);
        await refresh(true);
      } catch (error) {
        console.error('Failed to claim task:', error);
      } finally {
        setClaimingId(null);
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

  const createFeeding = useCallback(
    async (payload: CreateFeedingPayload) => {
      setCreating(true);
      try {
        await feedingService.createFeeding(payload);
        await refresh(true);
      } catch (error) {
        console.error('Failed to create feeding:', error);
        throw error;
      } finally {
        setCreating(false);
      }
    },
    [refresh]
  );

  const createTask = useCallback(
    async (payload: CreateTaskPayload) => {
      setCreating(true);
      try {
        await taskService.createTask(payload);
        await refresh(true);
      } catch (error) {
        console.error('Failed to create task:', error);
        throw error;
      } finally {
        setCreating(false);
      }
    },
    [refresh]
  );

  const createRide = useCallback(
    async (payload: CreateRidePayload) => {
      setCreating(true);
      try {
        await rideService.createRide(payload);
        await refresh(true);
      } catch (error) {
        console.error('Failed to create ride:', error);
        throw error;
      } finally {
        setCreating(false);
      }
    },
    [refresh]
  );

  const createTreatment = useCallback(
    async (payload: CreateTreatmentPayload) => {
      setCreating(true);
      try {
        await treatmentService.createTreatment(payload);
        await refresh(true);
      } catch (error) {
        console.error('Failed to create treatment:', error);
        throw error;
      } finally {
        setCreating(false);
      }
    },
    [refresh]
  );

  return {
    raw,
    listSections: listSections ?? EMPTY_SECTIONS,
    markedDates,
    selectedDate,
    setSelectedDate,
    selectedDateEvents,
    weekEvents,
    alertTimes,
    loading,
    refreshing,
    volunteeringId,
    claimingId,
    completingIds,
    creating,
    refresh,
    volunteerForFeeding,
    claimTask,
    markEventComplete,
    createFeeding,
    createTask,
    createRide,
    createTreatment,
    currentUserId: user?.userId,
  };
}

export type { TimelineEvent };
