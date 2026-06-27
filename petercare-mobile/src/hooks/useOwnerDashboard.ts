import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { withApiAction } from '../api/apiActionContext';
import * as roleRequestService from '../services/roleRequestService';
import * as userService from '../services/userService';
import { RoleRequest } from '../types/roleRequest';
import { UserSummary } from '../types/user';

function sortUsersByName(users: UserSummary[]): UserSummary[] {
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
}

export function useOwnerDashboard(isOwner: boolean) {
  const [pendingRequests, setPendingRequests] = useState<RoleRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);

  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const loadPendingRequests = useCallback(async () => {
    if (!isOwner) {
      setPendingRequests([]);
      return;
    }

    setRequestsLoading(true);
    setRequestsError(null);

    try {
      const pending = await roleRequestService.getPendingRoleRequests();
      setPendingRequests(pending);
    } catch (err) {
      console.error('Failed to load pending role requests:', err);
      setRequestsError('Could not load caregiver requests.');
    } finally {
      setRequestsLoading(false);
    }
  }, [isOwner]);

  const loadUsers = useCallback(async () => {
    if (!isOwner) {
      setAllUsers([]);
      return;
    }

    setUsersLoading(true);
    setUsersError(null);

    try {
      const users = await userService.getAllUsers();
      setAllUsers(sortUsersByName(users));
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsersError('Could not load users.');
    } finally {
      setUsersLoading(false);
    }
  }, [isOwner]);

  const reload = useCallback(async () => {
    await withApiAction('screen:OwnerDashboard', async () => {
      await Promise.all([loadPendingRequests(), loadUsers()]);
    });
  }, [loadPendingRequests, loadUsers]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      if (isOwner) {
        void reload();
      }
    }, [isOwner, reload]),
  );

  const approveRequest = useCallback(
    async (requestId: string, onApproved?: () => void) => {
      setReviewingRequestId(requestId);
      try {
        await roleRequestService.approveRoleRequest(requestId);
        setPendingRequests((prev) => prev.filter((request) => request.id !== requestId));
        await loadUsers();
        onApproved?.();
        Alert.alert('Approved', 'The user now has caregiver access.');
      } catch (err: unknown) {
        console.error('Failed to approve role request:', err);
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? 'Could not approve this request. Please try again.';
        Alert.alert('Approval Failed', message);
      } finally {
        setReviewingRequestId(null);
      }
    },
    [loadUsers],
  );

  const denyRequest = useCallback(async (requestId: string) => {
    setReviewingRequestId(requestId);
    try {
      await roleRequestService.denyRoleRequest(requestId);
      setPendingRequests((prev) => prev.filter((request) => request.id !== requestId));
      Alert.alert('Denied', 'The caregiver request has been denied.');
    } catch (err: unknown) {
      console.error('Failed to deny role request:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not deny this request. Please try again.';
      Alert.alert('Denial Failed', message);
    } finally {
      setReviewingRequestId(null);
    }
  }, []);

  return {
    pendingRequests,
    requestsLoading,
    requestsError,
    reviewingRequestId,
    allUsers,
    usersLoading,
    usersError,
    approveRequest,
    denyRequest,
    reload,
    reloadUsers: loadUsers,
  };
}
