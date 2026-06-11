import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as horseService from '../services/horseService';
import { Horse } from '../types/horse';

export function useHorseDirectory() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    horses,
    loading,
    refreshing,
    refresh,
  };
}
