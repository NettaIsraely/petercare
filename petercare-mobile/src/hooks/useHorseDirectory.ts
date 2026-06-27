import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { withApiAction } from '../api/apiActionContext';
import * as horseService from '../services/horseService';
import { CreateHorsePayload, Horse } from '../types/horse';

export function useHorseDirectory() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async (options?: { pull?: boolean; silent?: boolean }) => {
    if (options?.pull) {
      setRefreshing(true);
    } else if (!options?.silent) {
      setLoading(true);
    }

    try {
      await withApiAction(
        options?.pull ? 'pull-refresh:Barn/horses' : 'tab:Barn/horses',
        async () => {
          const data = await horseService.getAllHorses();
          setHorses(data);
        },
      );
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
      refresh({ silent: hasLoadedRef.current });
      hasLoadedRef.current = true;
    }, [refresh])
  );

  return {
    horses,
    loading,
    refreshing,
    creating,
    refresh: (isPullRefresh = false) => refresh(isPullRefresh ? { pull: true } : undefined),
    createHorse,
  };
}
