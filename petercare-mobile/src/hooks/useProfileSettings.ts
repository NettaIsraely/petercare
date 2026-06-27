import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { withApiAction } from '../api/apiActionContext';
import { useAuth } from '../context/AuthContext';
import { decodeToken, getToken } from '../services/authService';
import * as userService from '../services/userService';
import * as roleRequestService from '../services/roleRequestService';
import {
  formatTimeForApi,
  formatTimeForInput,
} from '../utils/dateHelpers';
import { RoleRequest } from '../types/roleRequest';
import { UserRole } from '../types/auth';
import { NotificationPreferences, ProfileColorKey } from '../types/user';
import { PROFILE_COLOR_OPTIONS } from '../utils/userColors';

interface ProfileFormState {
  name: string;
  email: string;
  profileColor: ProfileColorKey;
  morningAlertTime: string;
  eveningAlertTime: string;
  pushNotificationsEnabled: boolean;
  notifyFeedingReminders: boolean;
  notifyShiftReassigned: boolean;
  notifyUnassignedFeeding: boolean;
  notifyFeedingIncompleteAssignee: boolean;
  notifyFeedingIncompleteBroadcast: boolean;
  notifyTaskDeadlines: boolean;
  notifyRoleRequests: boolean;
  notifyRoleRequestResolved: boolean;
  notifyEventModified: boolean;
}

const DEFAULT_PROFILE_COLOR = PROFILE_COLOR_OPTIONS[0].key;

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  push_notifications_enabled: true,
  notify_feeding_reminders: true,
  notify_shift_reassigned: true,
  notify_unassigned_feeding: true,
  notify_feeding_incomplete_assignee: true,
  notify_feeding_incomplete_broadcast: true,
  notify_task_deadlines: true,
  notify_role_requests: true,
  notify_role_request_resolved: true,
  notify_event_modified: true,
};

const EMPTY_FORM: ProfileFormState = {
  name: '',
  email: '',
  profileColor: DEFAULT_PROFILE_COLOR,
  morningAlertTime: '',
  eveningAlertTime: '',
  pushNotificationsEnabled: true,
  notifyFeedingReminders: true,
  notifyShiftReassigned: true,
  notifyUnassignedFeeding: true,
  notifyFeedingIncompleteAssignee: true,
  notifyFeedingIncompleteBroadcast: true,
  notifyTaskDeadlines: true,
  notifyRoleRequests: true,
  notifyRoleRequestResolved: true,
  notifyEventModified: true,
};

function applyProfileToForm(profile: {
  name: string;
  email?: string;
  profile_color?: ProfileColorKey;
  morning_alert_time?: string;
  evening_alert_time?: string;
  push_notifications_enabled?: boolean;
  notify_feeding_reminders?: boolean;
  notify_shift_reassigned?: boolean;
  notify_unassigned_feeding?: boolean;
  notify_feeding_incomplete_assignee?: boolean;
  notify_feeding_incomplete_broadcast?: boolean;
  notify_task_deadlines?: boolean;
  notify_role_requests?: boolean;
  notify_role_request_resolved?: boolean;
  notify_event_modified?: boolean;
}): ProfileFormState {
  return {
    name: profile.name,
    email: profile.email ?? '',
    profileColor: profile.profile_color ?? DEFAULT_PROFILE_COLOR,
    morningAlertTime: formatTimeForInput(profile.morning_alert_time) || '08:00',
    eveningAlertTime: formatTimeForInput(profile.evening_alert_time) || '18:00',
    pushNotificationsEnabled:
      profile.push_notifications_enabled ?? DEFAULT_NOTIFICATION_PREFS.push_notifications_enabled,
    notifyFeedingReminders:
      profile.notify_feeding_reminders ?? DEFAULT_NOTIFICATION_PREFS.notify_feeding_reminders,
    notifyShiftReassigned:
      profile.notify_shift_reassigned ?? DEFAULT_NOTIFICATION_PREFS.notify_shift_reassigned,
    notifyUnassignedFeeding:
      profile.notify_unassigned_feeding ?? DEFAULT_NOTIFICATION_PREFS.notify_unassigned_feeding,
    notifyFeedingIncompleteAssignee:
      profile.notify_feeding_incomplete_assignee ??
      DEFAULT_NOTIFICATION_PREFS.notify_feeding_incomplete_assignee,
    notifyFeedingIncompleteBroadcast:
      profile.notify_feeding_incomplete_broadcast ??
      DEFAULT_NOTIFICATION_PREFS.notify_feeding_incomplete_broadcast,
    notifyTaskDeadlines:
      profile.notify_task_deadlines ?? DEFAULT_NOTIFICATION_PREFS.notify_task_deadlines,
    notifyRoleRequests:
      profile.notify_role_requests ?? DEFAULT_NOTIFICATION_PREFS.notify_role_requests,
    notifyRoleRequestResolved:
      profile.notify_role_request_resolved ??
      DEFAULT_NOTIFICATION_PREFS.notify_role_request_resolved,
    notifyEventModified:
      profile.notify_event_modified ?? DEFAULT_NOTIFICATION_PREFS.notify_event_modified,
  };
}

function validateForm(form: ProfileFormState): string | null {
  if (!form.name.trim()) {
    return 'Please enter your name.';
  }

  if (!form.email.trim()) {
    return 'Please enter your email address.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(form.email.trim().toLowerCase())) {
    return 'Please enter a valid email address.';
  }

  return null;
}

function getRoleDescription(role: UserRole | undefined): string {
  switch (role) {
    case 'GUEST':
      return 'Guests can view the stable. Request caregiver access to volunteer for shifts.';
    case 'CAREGIVER':
      return 'Caregivers can volunteer for and manage assigned shifts.';
    case 'OWNER':
      return 'Owners can approve role requests and manage the stable.';
    default:
      return '';
  }
}

async function getJwtRole(): Promise<UserRole | undefined> {
  const token = await getToken();
  if (!token) {
    return undefined;
  }
  return decodeToken(token)?.role;
}

export function useProfileSettings() {
  const { user, updateLocalUser, refreshSession } = useAuth();
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [displayRole, setDisplayRole] = useState<UserRole | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myRoleRequest, setMyRoleRequest] = useState<RoleRequest | null>(null);
  const [requestingRole, setRequestingRole] = useState(false);

  const hasChanges = useMemo(
    () =>
      form.name !== savedForm.name ||
      form.email !== savedForm.email ||
      form.profileColor !== savedForm.profileColor ||
      form.morningAlertTime !== savedForm.morningAlertTime ||
      form.eveningAlertTime !== savedForm.eveningAlertTime ||
      form.pushNotificationsEnabled !== savedForm.pushNotificationsEnabled ||
      form.notifyFeedingReminders !== savedForm.notifyFeedingReminders ||
      form.notifyShiftReassigned !== savedForm.notifyShiftReassigned ||
      form.notifyUnassignedFeeding !== savedForm.notifyUnassignedFeeding ||
      form.notifyFeedingIncompleteAssignee !== savedForm.notifyFeedingIncompleteAssignee ||
      form.notifyFeedingIncompleteBroadcast !== savedForm.notifyFeedingIncompleteBroadcast ||
      form.notifyTaskDeadlines !== savedForm.notifyTaskDeadlines ||
      form.notifyRoleRequests !== savedForm.notifyRoleRequests ||
      form.notifyRoleRequestResolved !== savedForm.notifyRoleRequestResolved ||
      form.notifyEventModified !== savedForm.notifyEventModified,
    [form, savedForm]
  );

  const loadRoleRequestData = useCallback(async (roleOverride?: UserRole) => {
    if (!user) {
      return;
    }

    const jwtRole = roleOverride ?? (await getJwtRole()) ?? user.role;

    try {
      if (jwtRole === 'GUEST') {
        const request = await roleRequestService.getMyRoleRequest();
        setMyRoleRequest(request);
      } else {
        setMyRoleRequest(null);
      }
    } catch (err) {
      console.error('Failed to load role request data:', err);
    }
  }, [user]);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profile = await userService.getUserById(user.userId);
      const nextForm = applyProfileToForm(profile);
      setForm(nextForm);
      setSavedForm(nextForm);

      let jwtRole = await getJwtRole();
      if (profile.role && profile.role !== jwtRole) {
        const refreshedUser = await refreshSession();
        jwtRole = refreshedUser?.role ?? profile.role;
      }

      setDisplayRole(profile.role ?? jwtRole ?? user.role);
      await loadRoleRequestData(jwtRole);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Could not load profile settings.');
      setForm({
        name: user.name,
        email: '',
        profileColor: DEFAULT_PROFILE_COLOR,
        morningAlertTime: '08:00',
        eveningAlertTime: '18:00',
        ...DEFAULT_NOTIFICATION_PREFS,
        pushNotificationsEnabled: DEFAULT_NOTIFICATION_PREFS.push_notifications_enabled,
        notifyFeedingReminders: DEFAULT_NOTIFICATION_PREFS.notify_feeding_reminders,
        notifyShiftReassigned: DEFAULT_NOTIFICATION_PREFS.notify_shift_reassigned,
        notifyUnassignedFeeding: DEFAULT_NOTIFICATION_PREFS.notify_unassigned_feeding,
        notifyFeedingIncompleteAssignee:
          DEFAULT_NOTIFICATION_PREFS.notify_feeding_incomplete_assignee,
        notifyFeedingIncompleteBroadcast:
          DEFAULT_NOTIFICATION_PREFS.notify_feeding_incomplete_broadcast,
        notifyTaskDeadlines: DEFAULT_NOTIFICATION_PREFS.notify_task_deadlines,
        notifyRoleRequests: DEFAULT_NOTIFICATION_PREFS.notify_role_requests,
        notifyRoleRequestResolved: DEFAULT_NOTIFICATION_PREFS.notify_role_request_resolved,
        notifyEventModified: DEFAULT_NOTIFICATION_PREFS.notify_event_modified,
      });
      setSavedForm({
        name: user.name,
        email: '',
        profileColor: DEFAULT_PROFILE_COLOR,
        morningAlertTime: '08:00',
        eveningAlertTime: '18:00',
        pushNotificationsEnabled: DEFAULT_NOTIFICATION_PREFS.push_notifications_enabled,
        notifyFeedingReminders: DEFAULT_NOTIFICATION_PREFS.notify_feeding_reminders,
        notifyShiftReassigned: DEFAULT_NOTIFICATION_PREFS.notify_shift_reassigned,
        notifyUnassignedFeeding: DEFAULT_NOTIFICATION_PREFS.notify_unassigned_feeding,
        notifyFeedingIncompleteAssignee:
          DEFAULT_NOTIFICATION_PREFS.notify_feeding_incomplete_assignee,
        notifyFeedingIncompleteBroadcast:
          DEFAULT_NOTIFICATION_PREFS.notify_feeding_incomplete_broadcast,
        notifyTaskDeadlines: DEFAULT_NOTIFICATION_PREFS.notify_task_deadlines,
        notifyRoleRequests: DEFAULT_NOTIFICATION_PREFS.notify_role_requests,
        notifyRoleRequestResolved: DEFAULT_NOTIFICATION_PREFS.notify_role_request_resolved,
        notifyEventModified: DEFAULT_NOTIFICATION_PREFS.notify_event_modified,
      });
    } finally {
      setLoading(false);
    }
  }, [user, refreshSession, loadRoleRequestData]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      if (!loading && user) {
        void withApiAction('screen:Profile', () => loadRoleRequestData());
      }
    }, [loading, user, loadRoleRequestData])
  );

  const setName = useCallback((name: string) => {
    setForm((prev) => ({ ...prev, name }));
  }, []);

  const setEmail = useCallback((email: string) => {
    setForm((prev) => ({ ...prev, email }));
  }, []);

  const setMorningAlertTime = useCallback((morningAlertTime: string) => {
    setForm((prev) => ({ ...prev, morningAlertTime }));
  }, []);

  const setEveningAlertTime = useCallback((eveningAlertTime: string) => {
    setForm((prev) => ({ ...prev, eveningAlertTime }));
  }, []);

  const setProfileColor = useCallback((profileColor: ProfileColorKey) => {
    setForm((prev) => ({ ...prev, profileColor }));
  }, []);

  const setPushNotificationsEnabled = useCallback((pushNotificationsEnabled: boolean) => {
    setForm((prev) => ({ ...prev, pushNotificationsEnabled }));
  }, []);

  const setNotifyFeedingReminders = useCallback((notifyFeedingReminders: boolean) => {
    setForm((prev) => ({ ...prev, notifyFeedingReminders }));
  }, []);

  const setNotifyShiftReassigned = useCallback((notifyShiftReassigned: boolean) => {
    setForm((prev) => ({ ...prev, notifyShiftReassigned }));
  }, []);

  const setNotifyUnassignedFeeding = useCallback((notifyUnassignedFeeding: boolean) => {
    setForm((prev) => ({ ...prev, notifyUnassignedFeeding }));
  }, []);

  const setNotifyFeedingIncompleteAssignee = useCallback(
    (notifyFeedingIncompleteAssignee: boolean) => {
      setForm((prev) => ({ ...prev, notifyFeedingIncompleteAssignee }));
    },
    []
  );

  const setNotifyFeedingIncompleteBroadcast = useCallback(
    (notifyFeedingIncompleteBroadcast: boolean) => {
      setForm((prev) => ({ ...prev, notifyFeedingIncompleteBroadcast }));
    },
    []
  );

  const setNotifyTaskDeadlines = useCallback((notifyTaskDeadlines: boolean) => {
    setForm((prev) => ({ ...prev, notifyTaskDeadlines }));
  }, []);

  const setNotifyRoleRequests = useCallback((notifyRoleRequests: boolean) => {
    setForm((prev) => ({ ...prev, notifyRoleRequests }));
  }, []);

  const setNotifyEventModified = useCallback((notifyEventModified: boolean) => {
    setForm((prev) => ({ ...prev, notifyEventModified }));
  }, []);

  const save = useCallback(async () => {
    if (!user) {
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    const morningTime = formatTimeForApi(form.morningAlertTime);
    const eveningTime = formatTimeForApi(form.eveningAlertTime);

    if (!morningTime || !eveningTime) {
      Alert.alert('Validation Error', 'Please enter valid alert times in HH:MM format.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await userService.updateUser(user.userId, {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        profile_color: form.profileColor,
        morning_alert_time: morningTime,
        evening_alert_time: eveningTime,
        push_notifications_enabled: form.pushNotificationsEnabled,
        notify_feeding_reminders: form.notifyFeedingReminders,
        notify_shift_reassigned: form.notifyShiftReassigned,
        notify_unassigned_feeding: form.notifyUnassignedFeeding,
        notify_feeding_incomplete_assignee: form.notifyFeedingIncompleteAssignee,
        notify_feeding_incomplete_broadcast: form.notifyFeedingIncompleteBroadcast,
        notify_task_deadlines: form.notifyTaskDeadlines,
        notify_role_requests: form.notifyRoleRequests,
        notify_role_request_resolved: form.notifyRoleRequestResolved,
        notify_event_modified: form.notifyEventModified,
      });

      const nextForm = applyProfileToForm(updated);
      setForm(nextForm);
      setSavedForm(nextForm);
      updateLocalUser({ name: updated.name });
      if (updated.role) {
        setDisplayRole(updated.role);
      }
      Alert.alert('Success', 'Your profile has been updated.');
    } catch (err: unknown) {
      console.error('Failed to save profile:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not save profile settings. Please try again.';
      Alert.alert('Save Failed', message);
    } finally {
      setSaving(false);
    }
  }, [form, user, updateLocalUser]);

  const requestCaregiverAccess = useCallback(async () => {
    if (!user || displayRole !== 'GUEST') {
      return;
    }

    if (myRoleRequest?.status === 'PENDING') {
      return;
    }

    setRequestingRole(true);
    setError(null);

    try {
      const request = await roleRequestService.createRoleRequest();
      setMyRoleRequest(request);
      Alert.alert('Request Submitted', 'Your caregiver access request has been sent to the stable owner.');
    } catch (err: unknown) {
      console.error('Failed to submit role request:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not submit your request. Please try again.';
      Alert.alert('Request Failed', message);
    } finally {
      setRequestingRole(false);
    }
  }, [user, displayRole, myRoleRequest]);

  const canRequestCaregiver =
    displayRole === 'GUEST' &&
    (!myRoleRequest || myRoleRequest.status === 'DENIED');

  return {
    form,
    loading,
    saving,
    error,
    hasChanges,
    role: displayRole,
    roleDescription: getRoleDescription(displayRole),
    myRoleRequest,
    requestingRole,
    canRequestCaregiver,
    setName,
    setEmail,
    setMorningAlertTime,
    setEveningAlertTime,
    setProfileColor,
    setPushNotificationsEnabled,
    setNotifyFeedingReminders,
    setNotifyShiftReassigned,
    setNotifyUnassignedFeeding,
    setNotifyFeedingIncompleteAssignee,
    setNotifyFeedingIncompleteBroadcast,
    setNotifyTaskDeadlines,
    setNotifyRoleRequests,
    setNotifyEventModified,
    save,
    requestCaregiverAccess,
    reload: loadProfile,
  };
}
