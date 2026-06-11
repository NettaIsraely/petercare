import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as rideService from '../services/rideService';
import * as treatmentService from '../services/treatmentService';
import {
  buildSeparatedHorseHistory,
  filterRidesForHorse,
  filterTreatmentsForHorse,
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
        const [rides, treatments] = await Promise.all([
          rideService.getAllRides(),
          treatmentService.getAllTreatments(),
        ]);

        const horseRides = filterRidesForHorse(rides, horseId);
        const horseTreatments = filterTreatmentsForHorse(treatments, horseId).filter(
          (treatment) => treatment.is_complete ?? false
        );
        const separated = buildSeparatedHorseHistory(horseRides, horseTreatments);
        setRides(separated.rides);
        setTreatments(separated.treatments);
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
