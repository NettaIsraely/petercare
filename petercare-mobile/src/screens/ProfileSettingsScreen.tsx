import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useProfileSettings } from '../hooks/useProfileSettings';
import TimePickerField from '../components/common/TimePickerField';
import ProfileColorPicker from '../components/profile/ProfileColorPicker';

export default function ProfileSettingsScreen() {
  const { logout } = useAuth();
  const {
    form,
    loading,
    saving,
    error,
    hasChanges,
    role,
    roleDescription,
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
  } = useProfileSettings();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Profile Settings</Text>
      <Text style={styles.subtitle}>Update your account details and alert preferences.</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={setName}
          placeholder="Full Name"
          placeholderTextColor="#BDC3C7"
          autoCapitalize="words"
        />

        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={setEmail}
          placeholder="Email Address"
          placeholderTextColor="#BDC3C7"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.fieldLabel}>Your Color</Text>
        <Text style={styles.fieldHelper}>
          This color appears on the schedule for events assigned to you.
        </Text>
        <ProfileColorPicker
          value={form.profileColor}
          onChange={setProfileColor}
        />

        <Text style={styles.fieldLabel}>Role</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role ?? '—'}</Text>
        </View>
        {roleDescription ? (
          <Text style={styles.roleDescription}>{roleDescription}</Text>
        ) : null}

        {role === 'GUEST' ? (
          <View style={styles.roleActionSection}>
            {myRoleRequest?.status === 'PENDING' ? (
              <View style={styles.statusBanner}>
                <Text style={styles.statusBannerText}>
                  Caregiver request pending approval.
                </Text>
              </View>
            ) : null}

            {myRoleRequest?.status === 'DENIED' ? (
              <View style={[styles.statusBanner, styles.statusBannerDenied]}>
                <Text style={styles.statusBannerText}>
                  Your previous caregiver request was denied. You may submit a new request.
                </Text>
              </View>
            ) : null}

            {canRequestCaregiver ? (
              <TouchableOpacity
                style={[styles.requestButton, requestingRole && styles.buttonDisabled]}
                onPress={requestCaregiverAccess}
                disabled={requestingRole}
              >
                {requestingRole ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.requestButtonText}>Request Caregiver Access</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <TimePickerField
          label="Morning Alert Time"
          value={form.morningAlertTime}
          onChange={setMorningAlertTime}
        />

        <TimePickerField
          label="Evening Alert Time"
          value={form.eveningAlertTime}
          onChange={setEveningAlertTime}
        />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.fieldHelper}>
          Choose which push notifications you receive. Turn everything off when travelling abroad.
        </Text>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBlock}>
            <Text style={styles.switchLabel}>All push notifications</Text>
            <Text style={styles.switchHelper}>Master switch for every notification type below.</Text>
          </View>
          <Switch
            value={form.pushNotificationsEnabled}
            onValueChange={setPushNotificationsEnabled}
            trackColor={{ false: '#BDC3C7', true: '#85C1E9' }}
            thumbColor={form.pushNotificationsEnabled ? '#3498DB' : '#ECF0F1'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBlock}>
            <Text style={styles.switchLabel}>Feeding shift reminders</Text>
            <Text style={styles.switchHelper}>Reminder before your assigned feeding shift.</Text>
          </View>
          <Switch
            value={form.notifyFeedingReminders}
            onValueChange={setNotifyFeedingReminders}
            disabled={!form.pushNotificationsEnabled}
            trackColor={{ false: '#BDC3C7', true: '#85C1E9' }}
            thumbColor={form.notifyFeedingReminders ? '#3498DB' : '#ECF0F1'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBlock}>
            <Text style={styles.switchLabel}>Shift covered alerts</Text>
            <Text style={styles.switchHelper}>When someone else covers your feeding shift.</Text>
          </View>
          <Switch
            value={form.notifyShiftReassigned}
            onValueChange={setNotifyShiftReassigned}
            disabled={!form.pushNotificationsEnabled}
            trackColor={{ false: '#BDC3C7', true: '#85C1E9' }}
            thumbColor={form.notifyShiftReassigned ? '#3498DB' : '#ECF0F1'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBlock}>
            <Text style={styles.switchLabel}>Unassigned feeding alerts</Text>
            <Text style={styles.switchHelper}>Tomorrow&apos;s feeding is still unassigned.</Text>
          </View>
          <Switch
            value={form.notifyUnassignedFeeding}
            onValueChange={setNotifyUnassignedFeeding}
            disabled={!form.pushNotificationsEnabled}
            trackColor={{ false: '#BDC3C7', true: '#85C1E9' }}
            thumbColor={form.notifyUnassignedFeeding ? '#3498DB' : '#ECF0F1'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBlock}>
            <Text style={styles.switchLabel}>Feeding completion prompts</Text>
            <Text style={styles.switchHelper}>Ask you to confirm if you completed your feeding.</Text>
          </View>
          <Switch
            value={form.notifyFeedingIncompleteAssignee}
            onValueChange={setNotifyFeedingIncompleteAssignee}
            disabled={!form.pushNotificationsEnabled}
            trackColor={{ false: '#BDC3C7', true: '#85C1E9' }}
            thumbColor={form.notifyFeedingIncompleteAssignee ? '#3498DB' : '#ECF0F1'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBlock}>
            <Text style={styles.switchLabel}>Horses not fed alerts</Text>
            <Text style={styles.switchHelper}>When a feeding is still incomplete by 10:00 AM / 20:30 PM.</Text>
          </View>
          <Switch
            value={form.notifyFeedingIncompleteBroadcast}
            onValueChange={setNotifyFeedingIncompleteBroadcast}
            disabled={!form.pushNotificationsEnabled}
            trackColor={{ false: '#BDC3C7', true: '#85C1E9' }}
            thumbColor={form.notifyFeedingIncompleteBroadcast ? '#3498DB' : '#ECF0F1'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBlock}>
            <Text style={styles.switchLabel}>Task deadline reminders</Text>
            <Text style={styles.switchHelper}>Reminder the day before a task is due.</Text>
          </View>
          <Switch
            value={form.notifyTaskDeadlines}
            onValueChange={setNotifyTaskDeadlines}
            disabled={!form.pushNotificationsEnabled}
            trackColor={{ false: '#BDC3C7', true: '#85C1E9' }}
            thumbColor={form.notifyTaskDeadlines ? '#3498DB' : '#ECF0F1'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBlock}>
            <Text style={styles.switchLabel}>Event change alerts</Text>
            <Text style={styles.switchHelper}>
              When someone else edits an event you&apos;re part of, or joins your ride.
            </Text>
          </View>
          <Switch
            value={form.notifyEventModified}
            onValueChange={setNotifyEventModified}
            disabled={!form.pushNotificationsEnabled}
            trackColor={{ false: '#BDC3C7', true: '#85C1E9' }}
            thumbColor={form.notifyEventModified ? '#3498DB' : '#ECF0F1'}
          />
        </View>

        {role === 'OWNER' ? (
          <View style={styles.switchRow}>
            <View style={styles.switchLabelBlock}>
              <Text style={styles.switchLabel}>Caregiver access requests</Text>
              <Text style={styles.switchHelper}>When a guest requests caregiver access.</Text>
            </View>
            <Switch
              value={form.notifyRoleRequests}
              onValueChange={setNotifyRoleRequests}
              disabled={!form.pushNotificationsEnabled}
              trackColor={{ false: '#BDC3C7', true: '#85C1E9' }}
              thumbColor={form.notifyRoleRequests ? '#3498DB' : '#ECF0F1'}
            />
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
        onPress={save}
        disabled={!hasChanges || saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 12,
  },
  fieldHelper: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 10,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  switchLabelBlock: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  switchHelper: {
    fontSize: 12,
    color: '#7F8C8D',
    lineHeight: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2C3E50',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF5FB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498DB',
  },
  roleDescription: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 8,
    lineHeight: 18,
  },
  roleActionSection: {
    marginTop: 12,
  },
  statusBanner: {
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statusBannerDenied: {
    backgroundColor: '#FDEDEC',
  },
  statusBannerText: {
    fontSize: 13,
    color: '#2C3E50',
    lineHeight: 18,
  },
  requestButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
