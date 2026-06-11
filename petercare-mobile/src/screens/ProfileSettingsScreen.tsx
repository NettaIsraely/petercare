import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useProfileSettings } from '../hooks/useProfileSettings';
import TimePickerField from '../components/common/TimePickerField';

export default function ProfileSettingsScreen() {
  const { logout } = useAuth();
  const {
    form,
    loading,
    saving,
    error,
    hasChanges,
    role,
    setName,
    setEmail,
    setMorningAlertTime,
    setEveningAlertTime,
    save,
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

        <Text style={styles.fieldLabel}>Role</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role ?? '—'}</Text>
        </View>

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
