import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as userService from '../services/userService';
import {
  formatTimeForApi,
  formatTimeForInput,
} from '../utils/dateHelpers';

interface ProfileFormState {
  name: string;
  email: string;
  morningAlertTime: string;
  eveningAlertTime: string;
}

const EMPTY_FORM: ProfileFormState = {
  name: '',
  email: '',
  morningAlertTime: '',
  eveningAlertTime: '',
};

function applyProfileToForm(profile: {
  name: string;
  email?: string;
  morning_alert_time?: string;
  evening_alert_time?: string;
}): ProfileFormState {
  return {
    name: profile.name,
    email: profile.email ?? '',
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

export function useProfileSettings() {
  const { user, updateLocalUser } = useAuth();
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = useMemo(
    () =>
      form.name !== savedForm.name ||
      form.email !== savedForm.email ||
      form.morningAlertTime !== savedForm.morningAlertTime ||
      form.eveningAlertTime !== savedForm.eveningAlertTime,
    [form, savedForm]
  );

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
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Could not load profile settings.');
      setForm({
        name: user.name,
        email: '',
        morningAlertTime: '08:00',
        eveningAlertTime: '18:00',
      });
      setSavedForm({
        name: user.name,
        email: '',
        morningAlertTime: '08:00',
        eveningAlertTime: '18:00',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
        morning_alert_time: morningTime,
        evening_alert_time: eveningTime,
      });

      const nextForm = applyProfileToForm(updated);
      setForm(nextForm);
      setSavedForm(nextForm);
      updateLocalUser({ name: updated.name });
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

  return {
    form,
    loading,
    saving,
    error,
    hasChanges,
    role: user?.role,
    setName,
    setEmail,
    setMorningAlertTime,
    setEveningAlertTime,
    save,
    reload: loadProfile,
  };
}
