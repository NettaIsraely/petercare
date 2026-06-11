import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as feedingService from '../services/feedingService';
import * as horseService from '../services/horseService';
import * as rideService from '../services/rideService';
import * as taskService from '../services/taskService';
import {
  computeHorseRideCounts,
  computePersonalChecklist,
  getCurrentWeekRange,
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

export function useInsightsData() {
  const { user } = useAuth();
  const [weekRange, setWeekRange] = useState<WeekRange>(() => getCurrentWeekRange());
  const [horseRideCounts, setHorseRideCounts] = useState<HorseRideCount[]>([]);
  const [personalChecklist, setPersonalChecklist] =
    useState<PersonalChecklist>(EMPTY_CHECKLIST);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        const currentWeekRange = getCurrentWeekRange();
        const [horses, rides, feedings, tasks] = await Promise.all([
          horseService.getAllHorses(),
          rideService.getAllRides(),
          feedingService.getAllFeedings(),
          taskService.getAllTasks(),
        ]);

        setWeekRange(currentWeekRange);
        setHorseRideCounts(computeHorseRideCounts(horses, rides, currentWeekRange));
        setPersonalChecklist(
          computePersonalChecklist(user.userId, feedings, tasks, currentWeekRange)
        );
      } catch (error) {
        console.error('Failed to load insights data:', error);
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

  return {
    weekRange,
    horseRideCounts,
    personalChecklist,
    loading,
    refreshing,
    refresh,
  };
}
