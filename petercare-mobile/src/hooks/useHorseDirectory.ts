import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as horseService from '../services/horseService';
import { CreateHorsePayload, Horse } from '../types/horse';

export function useHorseDirectory() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await horseService.getAllHorses();
      setHorses(data);
    } catch (error) {
      console.error('Failed to load horses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const createHorse = useCallback(async (payload: CreateHorsePayload) => {
    setCreating(true);
    try {
      const created = await horseService.createHorse(payload);
      setHorses((prev) => [created, ...prev]);
      return created;
    } finally {
      setCreating(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    horses,
    loading,
    refreshing,
    creating,
    refresh,
    createHorse,
  };
}
