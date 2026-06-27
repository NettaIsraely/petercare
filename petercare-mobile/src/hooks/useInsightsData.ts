import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as feedingService from '../services/feedingService';
import * as horseService from '../services/horseService';
import * as rideService from '../services/rideService';
import * as taskService from '../services/taskService';
import { Feeding } from '../types/feeding';
import { Horse } from '../types/horse';
import { Ride } from '../types/ride';
import { Task } from '../types/task';
import {
  computeHorseRideCounts,
  computePersonalChecklist,
  getWeekRangeForOffset,
  HorseRideCount,
  PersonalChecklist,
  WeekRange,
} from '../utils/insightsHelpers';

const EMPTY_CHECKLIST: PersonalChecklist = {
  feedings: [],
  tasks: [],
  summary: {
    feedingsComplete: 0,
    feedingsTotal: 0,
    tasksComplete: 0,
    tasksTotal: 0,
  },
};

interface CachedInsightsData {
  horses: Horse[];
  rides: Ride[];
  feedings: Feeding[];
  tasks: Task[];
}

export function useInsightsData() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [cachedData, setCachedData] = useState<CachedInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const weekRange = useMemo<WeekRange>(
    () => getWeekRangeForOffset(weekOffset),
    [weekOffset]
  );

  const horseRideCounts = useMemo<HorseRideCount[]>(() => {
    if (!cachedData) {
      return [];
    }
    return computeHorseRideCounts(cachedData.horses, cachedData.rides, weekRange);
  }, [cachedData, weekRange]);

  const personalChecklist = useMemo<PersonalChecklist>(() => {
    if (!cachedData || !user) {
      return EMPTY_CHECKLIST;
    }
    return computePersonalChecklist(
      user.userId,
      cachedData.feedings,
      cachedData.tasks,
      weekRange
    );
  }, [cachedData, user, weekRange]);

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
        const [horses, rides, feedings, tasks] = await Promise.all([
          horseService.getAllHorses(),
          rideService.getAllRides(),
          feedingService.getAllFeedings(),
          taskService.getAllTasks(),
        ]);

        setCachedData({ horses, rides, feedings, tasks });
      } catch (error) {
        console.error('Failed to load insights data:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  const goToCurrentWeek = useCallback(() => {
    setWeekOffset(0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    weekOffset,
    setWeekOffset,
    goToCurrentWeek,
    weekRange,
    horseRideCounts,
    personalChecklist,
    cachedData,
    loading,
    refreshing,
    refresh,
  };
}
