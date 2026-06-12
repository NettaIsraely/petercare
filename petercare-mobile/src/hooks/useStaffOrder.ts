import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import * as userService from '../services/userService';
import { UserSummary } from '../types/user';

function moveUser(
  users: UserSummary[],
  index: number,
  direction: 'up' | 'down',
): UserSummary[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= users.length) {
    return users;
  }

  const next = [...users];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function useStaffOrder(isOwner: boolean) {
  const [staffUsers, setStaffUsers] = useState<UserSummary[]>([]);
  const [savedStaffUsers, setSavedStaffUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaffOrder = useCallback(async () => {
    if (!isOwner) {
      setStaffUsers([]);
      setSavedStaffUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const users = await userService.getAssignableUsers();
      setStaffUsers(users);
      setSavedStaffUsers(users);
    } catch (err) {
      console.error('Failed to load staff order:', err);
      setError('Could not load staff order.');
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    void loadStaffOrder();
  }, [loadStaffOrder]);

  const hasChanges = useMemo(() => {
    if (staffUsers.length !== savedStaffUsers.length) {
      return true;
    }

    return staffUsers.some((user, index) => user.id !== savedStaffUsers[index]?.id);
  }, [staffUsers, savedStaffUsers]);

  const moveStaffUser = useCallback((index: number, direction: 'up' | 'down') => {
    setStaffUsers((current) => moveUser(current, index, direction));
  }, []);

  const saveStaffOrder = useCallback(async () => {
    if (!isOwner || !hasChanges) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await userService.updateDisplayOrder(staffUsers.map((user) => user.id));
      setStaffUsers(updated);
      setSavedStaffUsers(updated);
      Alert.alert('Success', 'Staff order has been updated.');
    } catch (err: unknown) {
      console.error('Failed to save staff order:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not save staff order. Please try again.';
      Alert.alert('Save Failed', message);
    } finally {
      setSaving(false);
    }
  }, [hasChanges, isOwner, staffUsers]);

  return {
    staffUsers,
    staffOrderLoading: loading,
    staffOrderSaving: saving,
    staffOrderError: error,
    staffOrderHasChanges: hasChanges,
    moveStaffUser,
    saveStaffOrder,
    reloadStaffOrder: loadStaffOrder,
  };
}
