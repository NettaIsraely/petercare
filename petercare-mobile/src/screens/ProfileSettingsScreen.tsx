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
import { useStaffOrder } from '../hooks/useStaffOrder';

function formatRequestDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
    pendingRequests,
    requestingRole,
    reviewingRequestId,
    canRequestCaregiver,
    setName,
    setEmail,
    setMorningAlertTime,
    setEveningAlertTime,
    save,
    requestCaregiverAccess,
    approveRequest,
    denyRequest,
  } = useProfileSettings();
  const {
    staffUsers,
    staffOrderLoading,
    staffOrderSaving,
    staffOrderError,
    staffOrderHasChanges,
    moveStaffUser,
    saveStaffOrder,
  } = useStaffOrder(role === 'OWNER');

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

      {role === 'OWNER' ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Pending Role Requests</Text>
          {pendingRequests.length === 0 ? (
            <Text style={styles.emptyText}>No pending caregiver requests.</Text>
          ) : (
            pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <Text style={styles.requestName}>{request.user.name}</Text>
                {request.user.email ? (
                  <Text style={styles.requestEmail}>{request.user.email}</Text>
                ) : null}
                <Text style={styles.requestDate}>
                  Requested {formatRequestDate(request.created_at)}
                </Text>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[
                      styles.approveButton,
                      reviewingRequestId === request.id && styles.buttonDisabled,
                    ]}
                    onPress={() => approveRequest(request.id)}
                    disabled={reviewingRequestId === request.id}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.denyButton,
                      reviewingRequestId === request.id && styles.buttonDisabled,
                    ]}
                    onPress={() => denyRequest(request.id)}
                    disabled={reviewingRequestId === request.id}
                  >
                    <Text style={styles.denyButtonText}>Deny</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      ) : null}

      {role === 'OWNER' ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Staff Order</Text>
          <Text style={styles.sectionDescription}>
            Set the default order for caregivers and owners in assignment pickers.
          </Text>
          {staffOrderError ? <Text style={styles.errorText}>{staffOrderError}</Text> : null}
          {staffOrderLoading ? (
            <ActivityIndicator color="#3498DB" />
          ) : staffUsers.length === 0 ? (
            <Text style={styles.emptyText}>No caregivers or owners to order yet.</Text>
          ) : (
            staffUsers.map((staffUser, index) => (
              <View key={staffUser.id} style={styles.staffRow}>
                <Text style={styles.staffName}>{staffUser.name}</Text>
                <View style={styles.staffActions}>
                  <TouchableOpacity
                    style={[
                      styles.moveButton,
                      index === 0 && styles.buttonDisabled,
                    ]}
                    onPress={() => moveStaffUser(index, 'up')}
                    disabled={index === 0 || staffOrderSaving}
                  >
                    <Text style={styles.moveButtonText}>Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.moveButton,
                      index === staffUsers.length - 1 && styles.buttonDisabled,
                    ]}
                    onPress={() => moveStaffUser(index, 'down')}
                    disabled={index === staffUsers.length - 1 || staffOrderSaving}
                  >
                    <Text style={styles.moveButtonText}>Down</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <TouchableOpacity
            style={[
              styles.saveOrderButton,
              (!staffOrderHasChanges || staffOrderSaving) && styles.saveButtonDisabled,
            ]}
            onPress={saveStaffOrder}
            disabled={!staffOrderHasChanges || staffOrderSaving}
          >
            {staffOrderSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Staff Order</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 12,
    lineHeight: 18,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  staffName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginRight: 12,
  },
  staffActions: {
    flexDirection: 'row',
    gap: 8,
  },
  moveButton: {
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moveButtonText: {
    color: '#2980B9',
    fontWeight: '600',
    fontSize: 13,
  },
  saveOrderButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  requestCard: {
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  requestEmail: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 4,
    marginBottom: 10,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  denyButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  denyButtonText: {
    color: '#FFFFFF',
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
