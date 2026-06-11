import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Feeding } from '../../types/feeding';
import { UserRole } from '../../types/auth';
import { formatShiftLabel } from '../../utils/dateHelpers';
import { canPerformAction } from '../../utils/eventPermissions';

interface AlertBannerProps {
  unassignedFeedings: Feeding[];
  overdueFeedings: Feeding[];
  onVolunteer: (feedingId: string) => void;
  volunteeringId?: string | null;
  userRole?: UserRole;
  currentUserId?: string;
}

export default function AlertBanner({
  unassignedFeedings,
  overdueFeedings,
  onVolunteer,
  volunteeringId,
  userRole,
  currentUserId,
}: AlertBannerProps) {
  if (unassignedFeedings.length === 0 && overdueFeedings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {unassignedFeedings.map((feeding) => {
        const canVolunteer = canPerformAction(
          userRole,
          'volunteer',
          { kind: 'feeding', data: feeding, sortMinutes: 0 },
          currentUserId
        );

        return (
          <View key={`unassigned-${feeding.id}`} style={[styles.banner, styles.criticalBanner]}>
            <View style={styles.bannerContent}>
              <AlertTriangle size={20} color="#C0392B" />
              <Text style={styles.bannerText}>
                {formatShiftLabel(feeding.shift_type)} is still unassigned today.
              </Text>
            </View>
            {canVolunteer && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onVolunteer(feeding.id)}
                disabled={volunteeringId === feeding.id}
              >
                <Text style={styles.actionButtonText}>
                  {volunteeringId === feeding.id ? 'Volunteering...' : 'Volunteer'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {overdueFeedings.map((feeding) => (
        <View key={`overdue-${feeding.id}`} style={[styles.banner, styles.overdueBanner]}>
          <View style={styles.bannerContent}>
            <AlertTriangle size={20} color="#D68910" />
            <Text style={styles.bannerText}>
              Your {formatShiftLabel(feeding.shift_type).toLowerCase()} is overdue.
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    gap: 10,
  },
  banner: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  criticalBanner: {
    backgroundColor: '#FDEDEC',
    borderColor: '#F5B7B1',
  },
  overdueBanner: {
    backgroundColor: '#FEF9E7',
    borderColor: '#F9E79F',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
