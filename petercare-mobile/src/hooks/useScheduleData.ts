import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as feedingService from '../services/feedingService';
import * as taskService from '../services/taskService';
import * as rideService from '../services/rideService';
import * as treatmentService from '../services/treatmentService';
import * as userService from '../services/userService';
import * as horseService from '../services/horseService';
import { CreateTaskPayload, Task, UpdateTaskPayload } from '../types/task';
import { CreateRidePayload, Ride, UpdateRidePayload } from '../types/ride';
import { CreateTreatmentPayload, Treatment, UpdateTreatmentPayload } from '../types/treatment';
import { Horse } from '../types/horse';
import { UserSummary } from '../types/user';
import { Feeding, UpdateFeedingPayload } from '../types/feeding';
import { ScheduleSectionData, TimelineEvent } from '../types/events';
import {
  buildCalendarMarkedDates,
  buildScheduleListSections,
  CALENDAR_FEEDING_ALERT_TIMES,
  getEventsForDate,
  getEventsForWeek,
} from '../utils/scheduleHelpers';
import { toDateString, normalizeDateString, getNext14DayStrings } from '../utils/dateHelpers';
import { orderUsersForAssignment } from '../utils/assignableUsers';
import { completingKey } from '../utils/completionKeys';
import { confirmFeedingCompletionIfNeeded } from '../utils/feedingCompletionHelpers';
import { isExpectedRideSchedulingError } from '../utils/rideConflictHelpers';

interface RawScheduleData {
  feedings: Feeding[];
  tasks: Task[];
  rides: Ride[];
  treatments: Treatment[];
  horses: Horse[];
  users: UserSummary[];
  assignableUsers: UserSummary[];
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
    assignableUsers: [],
  });
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [volunteeringId, setVolunteeringId] = useState<string | null>(null);
  const [takingOverId, setTakingOverId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [volunteeringBatch, setVolunteeringBatch] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const assignableUsers = useMemo(
    () => orderUsersForAssignment(raw.assignableUsers, user?.userId),
    [raw.assignableUsers, user?.userId]
  );

  const availableUnassignedFeedings = useMemo(() => {
    const validDates = new Set(getNext14DayStrings());
    return raw.feedings
      .filter(
        (feeding) =>
          feeding.feeding_status === 'UNASSIGNED' &&
          validDates.has(normalizeDateString(feeding.schedule_date))
      )
      .sort((a, b) => {
        const dateCompare = normalizeDateString(a.schedule_date).localeCompare(
          normalizeDateString(b.schedule_date)
        );
        if (dateCompare !== 0) {
          return dateCompare;
        }
        return a.shift_type === 'MORNING' ? -1 : 1;
      });
  }, [raw.feedings]);

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
        const [feedings, tasks, rides, treatments, horses, users, assignableUsers, profile] =
          await Promise.all([
            feedingService.getAllFeedings(),
            taskService.getAllTasks(),
            rideService.getAllRides(),
            treatmentService.getAllTreatments(),
            horseService.getAllHorses(),
            userService.getAllUsers(),
            userService.getAssignableUsers(),
            userService.getUserById(user.userId).catch(() => undefined),
          ]);

        setRaw({ feedings, tasks, rides, treatments, horses, users, assignableUsers, profile });
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

  const takeOverFeeding = useCallback(
    async (feedingId: string) => {
      setTakingOverId(feedingId);
      try {
        await feedingService.takeOverFeeding(feedingId);
        await refresh(true);
      } catch (error) {
        console.error('Failed to take over feeding:', error);
        throw error;
      } finally {
        setTakingOverId(null);
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
      if (event.kind !== 'feeding' && event.kind !== 'task' && event.kind !== 'treatment') {
        return;
      }

      if (event.kind === 'feeding') {
        const confirmed = await confirmFeedingCompletionIfNeeded(event.data);
        if (!confirmed) {
          return;
        }
      }

      const key = completingKey(event.kind, event.data.id);
      setCompletingIds((prev) => new Set(prev).add(key));
      try {
        if (event.kind === 'feeding') {
          await feedingService.markFeedingComplete(event.data.id);
        } else if (event.kind === 'task') {
          await taskService.markTaskComplete(event.data.id);
        } else {
          await treatmentService.markTreatmentComplete(event.data.id);
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

  const volunteerForFeedings = useCallback(
    async (feedingIds: string[]) => {
      if (feedingIds.length === 0) {
        return;
      }

      setVolunteeringBatch(true);
      try {
        for (const feedingId of feedingIds) {
          await feedingService.volunteerForFeeding(feedingId);
        }
        await refresh(true);
      } catch (error) {
        console.error('Failed to volunteer for feedings:', error);
        throw error;
      } finally {
        setVolunteeringBatch(false);
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

  const createRide = useCallback(
    async (payload: CreateRidePayload) => {
      setCreating(true);
      try {
        await rideService.createRide(payload);
        await refresh(true);
      } catch (error) {
        if (!isExpectedRideSchedulingError(error)) {
          console.error('Failed to create ride:', error);
        }
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

  const updateRide = useCallback(
    async (id: string, payload: UpdateRidePayload) => {
      setUpdating(true);
      try {
        await rideService.updateRide(id, payload);
        await refresh(true);
      } catch (error) {
        if (!isExpectedRideSchedulingError(error)) {
          console.error('Failed to update ride:', error);
        }
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

  const deleteEvent = useCallback(
    async (event: TimelineEvent) => {
      setDeletingId(event.data.id);
      try {
        switch (event.kind) {
          case 'ride':
            await rideService.deleteRide(event.data.id);
            break;
          case 'task':
            await taskService.deleteTask(event.data.id);
            break;
          case 'treatment':
            await treatmentService.deleteTreatment(event.data.id);
            break;
          default:
            return;
        }
        await refresh(true);
      } catch (error) {
        console.error('Failed to delete event:', error);
      } finally {
        setDeletingId(null);
      }
    },
    [refresh]
  );

  return {
    raw,
    assignableUsers,
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
    takingOverId,
    claimingId,
    completingIds,
    creating,
    volunteeringBatch,
    updating,
    refresh,
    volunteerForFeeding,
    takeOverFeeding,
    volunteerForFeedings,
    claimTask,
    markEventComplete,
    availableUnassignedFeedings,
    createTask,
    updateTask,
    createRide,
    createTreatment,
    updateFeeding,
    updateRide,
    updateTreatment,
    deleteEvent,
    deletingId,
    currentUserId: user?.userId,
    userRole: user?.role,
  };
}

export type { TimelineEvent };
