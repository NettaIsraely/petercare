import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X } from 'lucide-react-native';
import { TimelineEvent } from '../../types/events';
import { Task } from '../../types/task';
import { HorseColor } from '../../types/horse';
import EventCard from '../home/EventCard';
import HorseIconRow from '../horses/HorseIconRow';
import TimePickerField from '../common/TimePickerField';
import {
  formatShiftLabel,
  formatTimeForApi,
  formatTimeLabel,
  normalizeDateString,
} from '../../utils/dateHelpers';
import { isCompletingKey } from '../../utils/completionKeys';

interface EventDetailModalProps {
  visible: boolean;
  event: TimelineEvent | null;
  currentUserId?: string;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
  volunteeringId?: string | null;
  claimingId?: string | null;
  completingIds: Set<string>;
  onClose: () => void;
  onVolunteer: (feedingId: string, notificationTime?: string) => void;
  onClaim: (taskId: string) => void;
  onMarkComplete: (event: TimelineEvent) => void;
  onEditTask?: (task: Task) => void;
}

function getDetailLines(event: TimelineEvent): string[] {
  switch (event.kind) {
    case 'feeding':
      return [
        `Date: ${normalizeDateString(event.data.schedule_date)}`,
        `Shift: ${formatShiftLabel(event.data.shift_type)}`,
        `Status: ${event.data.feeding_status}`,
        event.data.assigned_user
          ? `Assigned to: ${event.data.assigned_user.name}`
          : 'Unassigned',
      ];
    case 'task':
      return [
        event.data.deadline
          ? `Deadline: ${normalizeDateString(event.data.deadline)}`
          : 'No deadline',
        event.data.assigned_user
          ? `Assigned to: ${event.data.assigned_user.name}`
          : 'Unassigned',
        event.data.comments ? `Comments: ${event.data.comments}` : '',
        `Complete: ${event.data.is_complete ? 'Yes' : 'No'}`,
      ].filter(Boolean);
    case 'ride':
      return [
        `Date: ${normalizeDateString(event.data.date)}`,
        `Time: ${formatTimeLabel(event.data.start_time)} – ${formatTimeLabel(event.data.end_time)}`,
        `Primary rider: ${event.data.primary_rider.name}`,
        event.data.additional_riders?.length
          ? `Additional riders: ${event.data.additional_riders.map((r) => r.name).join(', ')}`
          : '',
      ].filter(Boolean);
    case 'treatment':
      return [
        `Date: ${normalizeDateString(event.data.date)}`,
        `Staff: ${event.data.user.name}`,
        event.data.duration_minutes
          ? `Duration: ${event.data.duration_minutes} min`
          : '',
      ].filter(Boolean);
    default:
      return [];
  }
}

function getHorseDetailSection(event: TimelineEvent): { colors: HorseColor[]; names: string } | null {
  if (event.kind === 'ride') {
    return {
      colors: event.data.horses.map((h) => h.color),
      names: event.data.horses.map((h) => h.name).join(', '),
    };
  }
  if (event.kind === 'treatment') {
    return {
      colors: [event.data.horse.color],
      names: event.data.horse.name,
    };
  }
  return null;
}

export default function EventDetailModal({
  visible,
  event,
  currentUserId,
  alertTimes,
  volunteeringId,
  claimingId,
  completingIds,
  onClose,
  onVolunteer,
  onClaim,
  onMarkComplete,
  onEditTask,
}: EventDetailModalProps) {
  const [notificationTime, setNotificationTime] = useState('08:00');

  if (!event) {
    return null;
  }

  const isFeedingUnassigned =
    event.kind === 'feeding' && event.data.feeding_status === 'UNASSIGNED';
  const isTaskUnassigned = event.kind === 'task' && !event.data.assigned_user;
  const isFeedingAssignedIncomplete =
    event.kind === 'feeding' &&
    event.data.feeding_status !== 'COMPLETE' &&
    event.data.feeding_status !== 'UNASSIGNED';
  const isTaskAssignedIncomplete =
    event.kind === 'task' &&
    !!event.data.assigned_user &&
    !(event.data.is_complete ?? false);

  const eventId = event.data.id;
  const isVolunteering = volunteeringId === eventId;
  const isClaiming = claimingId === eventId;
  const isCompleting =
    (event.kind === 'feeding' || event.kind === 'task') &&
    isCompletingKey(completingIds, event.kind, eventId);

  const canCompleteFeeding =
    isFeedingAssignedIncomplete && event.data.assigned_user?.id === currentUserId;
  const canCompleteTask =
    isTaskAssignedIncomplete && event.data.assigned_user?.id === currentUserId;

  const horseDetail = getHorseDetailSection(event);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Event Details</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <EventCard event={event} alertTimes={alertTimes} />

            <View style={styles.detailsCard}>
              {horseDetail ? (
                <View style={styles.horseSection}>
                  <HorseIconRow colors={horseDetail.colors} size={36} />
                  <Text style={styles.horseNames}>{horseDetail.names}</Text>
                </View>
              ) : null}
              {getDetailLines(event).map((line) => (
                <Text key={line} style={styles.detailLine}>
                  {line}
                </Text>
              ))}
            </View>

            {isFeedingUnassigned && (
              <View style={styles.actionSection}>
                <TimePickerField
                  label="Notification reminder time (optional)"
                  value={notificationTime}
                  onChange={setNotificationTime}
                  optional
                />
                <TouchableOpacity
                  style={[styles.primaryButton, styles.volunteerButton]}
                  onPress={() =>
                    onVolunteer(eventId, formatTimeForApi(notificationTime))
                  }
                  disabled={isVolunteering}
                >
                  {isVolunteering ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Volunteer</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {isTaskUnassigned && (
              <TouchableOpacity
                style={[styles.primaryButton, styles.claimButton]}
                onPress={() => onClaim(eventId)}
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Claim Task</Text>
                )}
              </TouchableOpacity>
            )}

            {canCompleteFeeding && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onMarkComplete(event)}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Mark Feeding Complete</Text>
                )}
              </TouchableOpacity>
            )}

            {canCompleteTask && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onMarkComplete(event)}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Mark Task Complete</Text>
                )}
              </TouchableOpacity>
            )}

            {event.kind === 'task' && onEditTask && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => onEditTask(event.data)}
              >
                <Text style={styles.secondaryButtonText}>Edit Task</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  horseSection: {
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  horseNames: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  detailLine: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 6,
  },
  actionSection: {
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 8,
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
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3498DB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  volunteerButton: {
    backgroundColor: '#E74C3C',
  },
  claimButton: {
    backgroundColor: '#27AE60',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  secondaryButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
  },
});
