import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { withApiAction } from '../api/apiActionContext';
import * as rideService from '../services/rideService';
import * as horseService from '../services/horseService';
import {
  buildSeparatedHorseHistory,
  filterRidesForHorse,
  HorseHistoryEntry,
} from '../utils/horseHelpers';

export function useHorseDetail(horseId: string) {
  const [rides, setRides] = useState<HorseHistoryEntry[]>([]);
  const [treatments, setTreatments] = useState<HorseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(
    async (isPullRefresh = false) => {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        await withApiAction(
          isPullRefresh ? 'pull-refresh:HorseDetail' : 'screen:HorseDetail',
          async () => {
            const [rides, treatments] = await Promise.all([
              rideService.getAllRides(),
              horseService.getHorseTreatments(horseId),
            ]);

            const horseRides = filterRidesForHorse(rides, horseId);
            const separated = buildSeparatedHorseHistory(horseRides, treatments);
            setRides(separated.rides);
            setTreatments(separated.treatments);
          },
        );
      } catch (error) {
        console.error('Failed to load horse detail:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [horseId]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    rides,
    treatments,
    loading,
    refreshing,
    refresh,
  };
}
