import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
import { ProfileColorKey } from '../types/user';
import { PROFILE_COLOR_OPTIONS } from '../utils/userColors';

interface ProfileFormState {
  name: string;
  email: string;
  profileColor: ProfileColorKey;
  morningAlertTime: string;
  eveningAlertTime: string;
}

const DEFAULT_PROFILE_COLOR = PROFILE_COLOR_OPTIONS[0].key;

const EMPTY_FORM: ProfileFormState = {
  name: '',
  email: '',
  profileColor: DEFAULT_PROFILE_COLOR,
  morningAlertTime: '',
  eveningAlertTime: '',
};

function applyProfileToForm(profile: {
  name: string;
  email?: string;
  profile_color?: ProfileColorKey;
  morning_alert_time?: string;
  evening_alert_time?: string;
}): ProfileFormState {
  return {
    name: profile.name,
    email: profile.email ?? '',
    profileColor: profile.profile_color ?? DEFAULT_PROFILE_COLOR,
    morningAlertTime: formatTimeForInput(profile.morning_alert_time) || '08:00',
    eveningAlertTime: formatTimeForInput(profile.evening_alert_time) || '18:00',
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
      form.eveningAlertTime !== savedForm.eveningAlertTime,
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
      });
      setSavedForm({
        name: user.name,
        email: '',
        profileColor: DEFAULT_PROFILE_COLOR,
        morningAlertTime: '08:00',
        eveningAlertTime: '18:00',
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
        void loadRoleRequestData();
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
    save,
    requestCaregiverAccess,
    reload: loadProfile,
  };
}
