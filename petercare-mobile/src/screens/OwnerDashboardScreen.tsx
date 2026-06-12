import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useOwnerDashboard } from '../hooks/useOwnerDashboard';
import { useStaffOrder } from '../hooks/useStaffOrder';
import { UserRole } from '../types/auth';

function formatRequestDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRoleLabel(role: UserRole | undefined): string {
  return role ?? '—';
}

export default function OwnerDashboardScreen() {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';
  const [refreshing, setRefreshing] = useState(false);

  const {
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
  } = useOwnerDashboard(isOwner);

  const {
    staffUsers,
    staffOrderLoading,
    staffOrderSaving,
    staffOrderError,
    staffOrderHasChanges,
    moveStaffUser,
    saveStaffOrder,
    reloadStaffOrder,
  } = useStaffOrder(isOwner);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([reload(), reloadStaffOrder()]);
    } finally {
      setRefreshing(false);
    }
  }, [reload, reloadStaffOrder]);

  const handleApprove = useCallback(
    (requestId: string) => {
      void approveRequest(requestId, () => {
        void reloadStaffOrder();
      });
    },
    [approveRequest, reloadStaffOrder],
  );

  if (!isOwner) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedText}>Owner access only.</Text>
      </View>
    );
  }

  const isInitialLoading =
    (requestsLoading || usersLoading || staffOrderLoading) &&
    !refreshing &&
    pendingRequests.length === 0 &&
    allUsers.length === 0 &&
    staffUsers.length === 0;

  if (isInitialLoading) {
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
          tintColor="#3498DB"
        />
      }
    >
      <Text style={styles.title}>Owner Dashboard</Text>
      <Text style={styles.subtitle}>
        Manage caregiver requests, staff order, and view all users.
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Caregiver Requests</Text>
        {requestsError ? <Text style={styles.errorText}>{requestsError}</Text> : null}
        {requestsLoading && pendingRequests.length === 0 ? (
          <ActivityIndicator color="#3498DB" />
        ) : pendingRequests.length === 0 ? (
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
                  onPress={() => handleApprove(request.id)}
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

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Staff Order</Text>
        <Text style={styles.sectionDescription}>
          Set the default order for caregivers and owners in assignment pickers.
        </Text>
        {staffOrderError ? <Text style={styles.errorText}>{staffOrderError}</Text> : null}
        {staffOrderLoading && staffUsers.length === 0 ? (
          <ActivityIndicator color="#3498DB" />
        ) : staffUsers.length === 0 ? (
          <Text style={styles.emptyText}>No caregivers or owners to order yet.</Text>
        ) : (
          staffUsers.map((staffUser, index) => (
            <View key={staffUser.id} style={styles.staffRow}>
              <Text style={styles.staffName}>{staffUser.name}</Text>
              <View style={styles.staffActions}>
                <TouchableOpacity
                  style={[styles.moveButton, index === 0 && styles.buttonDisabled]}
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

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>All Users</Text>
        {usersError ? <Text style={styles.errorText}>{usersError}</Text> : null}
        {usersLoading && allUsers.length === 0 ? (
          <ActivityIndicator color="#3498DB" />
        ) : allUsers.length === 0 ? (
          <Text style={styles.emptyText}>No users found.</Text>
        ) : (
          allUsers.map((listedUser) => (
            <View key={listedUser.id} style={styles.userRow}>
              <Text style={styles.userName}>{listedUser.name}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{formatRoleLabel(listedUser.role)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
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
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  userName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginRight: 12,
  },
  roleBadge: {
    backgroundColor: '#EBF5FB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3498DB',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
