import React, { useEffect, useState } from 'react';
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
import { getDisplayAdditionalRiders } from '../../types/ride';
import { TimelineEvent } from '../../types/events';
import { UserRole } from '../../types/auth';
import { HorseColor } from '../../types/horse';
import EventCard from '../home/EventCard';
import HorseIconRow from '../horses/HorseIconRow';
import TimePickerField from '../common/TimePickerField';
import {
  formatShiftLabel,
  formatTimeForApi,
  formatTimeForInput,
  formatTimeLabel,
  formatUserFacingDate,
} from '../../utils/dateHelpers';
import { isCompletingKey } from '../../utils/completionKeys';
import { eventHasComments, getEventComments, isEventCompleted } from '../../utils/scheduleHelpers';
import { canEditEvent, canToggleComplete, canDeleteEvent, canJoinRide, canPerformAction } from '../../utils/eventPermissions';

interface EventDetailModalProps {
  visible: boolean;
  event: TimelineEvent | null;
  currentUserId?: string;
  userRole?: UserRole;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
  volunteeringId?: string | null;
  takingOverId?: string | null;
  claimingId?: string | null;
  completingIds: Set<string>;
  onClose: () => void;
  onVolunteer: (feedingId: string, notificationTime?: string) => void;
  onTakeOver?: (feedingId: string) => void;
  onClaim: (taskId: string) => void;
  onMarkComplete: (event: TimelineEvent) => void;
  onEdit?: (event: TimelineEvent) => void;
  onJoin?: (event: TimelineEvent) => void;
  onDelete?: (event: TimelineEvent) => void;
  deletingId?: string | null;
}

function getDetailLines(event: TimelineEvent): string[] {
  switch (event.kind) {
    case 'feeding':
      return [
        `Date: ${formatUserFacingDate(event.data.schedule_date)}`,
        `Shift: ${formatShiftLabel(event.data.shift_type)}`,
        `Status: ${event.data.feeding_status}`,
        event.data.assigned_user
          ? `Assigned to: ${event.data.assigned_user.name}`
          : 'Unassigned',
      ];
    case 'task':
      return [
        event.data.deadline
          ? `Deadline: ${formatUserFacingDate(event.data.deadline)}`
          : 'No deadline',
        event.data.assigned_user
          ? `Assigned to: ${event.data.assigned_user.name}`
          : 'Unassigned',
        `Complete: ${event.data.is_complete ? 'Yes' : 'No'}`,
      ].filter(Boolean);
    case 'ride': {
      const additionalRiders = getDisplayAdditionalRiders(event.data);
      return [
        `Date: ${formatUserFacingDate(event.data.date)}`,
        `Time: ${formatTimeLabel(event.data.start_time)} – ${formatTimeLabel(event.data.end_time)}`,
        `Primary rider: ${event.data.primary_rider.name}`,
        additionalRiders.length
          ? `Additional riders: ${additionalRiders.map((r) => r.name).join(', ')}`
          : '',
      ].filter(Boolean);
    }
    case 'treatment':
      return [
        `Date: ${formatUserFacingDate(event.data.date)}`,
        `Staff: ${event.data.user.name}`,
        event.data.duration_minutes
          ? `Duration: ${event.data.duration_minutes} min`
          : '',
        `Complete: ${event.data.is_complete ? 'Yes' : 'No'}`,
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
      colors: event.data.horses.map((h) => h.color),
      names: event.data.horses.map((h) => h.name).join(', '),
    };
  }
  return null;
}

function getDefaultAlertTime(
  event: TimelineEvent,
  alertTimes?: EventDetailModalProps['alertTimes'],
): string {
  if (event.kind !== 'feeding') {
    return '08:00';
  }

  const alertTime =
    event.data.shift_type === 'MORNING'
      ? alertTimes?.morningTime
      : alertTimes?.eveningTime;

  return formatTimeForInput(alertTime) || '08:00';
}

export default function EventDetailModal({
  visible,
  event,
  currentUserId,
  userRole,
  alertTimes,
  volunteeringId,
  takingOverId,
  claimingId,
  completingIds,
  onClose,
  onVolunteer,
  onTakeOver,
  onClaim,
  onMarkComplete,
  onEdit,
  onJoin,
  onDelete,
  deletingId,
}: EventDetailModalProps) {
  const [notificationTime, setNotificationTime] = useState('08:00');

  useEffect(() => {
    if (!visible || !event) {
      return;
    }
    setNotificationTime(getDefaultAlertTime(event, alertTimes));
  }, [visible, event?.data.id, event?.kind]);

  if (!event) {
    return null;
  }

  const showVolunteer = canPerformAction(userRole, 'volunteer', event, currentUserId);
  const showTakeOver = onTakeOver && canPerformAction(userRole, 'takeOver', event, currentUserId);
  const showClaim = canPerformAction(userRole, 'claim', event, currentUserId);
  const showToggleComplete = canToggleComplete(userRole, event, currentUserId);
  const eventIsComplete = isEventCompleted(event);
  const showJoin = onJoin && canJoinRide(userRole, event, currentUserId);
  const showEdit = onEdit && canEditEvent(userRole, event, currentUserId);
  const showDelete = onDelete && canDeleteEvent(userRole, event);

  const eventId = event.data.id;
  const isVolunteering = volunteeringId === eventId;
  const isTakingOver = takingOverId === eventId;
  const isClaiming = claimingId === eventId;
  const isDeleting = deletingId === eventId;
  const isCompleting =
    (event.kind === 'feeding' || event.kind === 'task' || event.kind === 'treatment') &&
    isCompletingKey(completingIds, event.kind, eventId);

  const horseDetail = getHorseDetailSection(event);

  const getEditLabel = () => {
    switch (event.kind) {
      case 'feeding':
        return 'Edit Feeding';
      case 'task':
        return 'Edit Task';
      case 'ride':
        return 'Edit Ride';
      case 'treatment':
        return 'Edit Treatment';
      default:
        return 'Edit';
    }
  };

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
            <EventCard event={event} alertTimes={alertTimes} showCommentsMarker={false} />

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
              {eventHasComments(event) && (
                <View style={styles.commentsSection}>
                  <Text style={styles.commentsLabel}>Comments</Text>
                  <Text style={styles.commentsBody}>{getEventComments(event)}</Text>
                </View>
              )}
            </View>

            {showVolunteer && (
              <View style={styles.actionSection}>
                <TimePickerField
                  label="Notification reminder time (optional)"
                  value={notificationTime}
                  onChange={setNotificationTime}
                  optional
                />
                <TouchableOpacity
                  style={styles.primaryButton}
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

            {showTakeOver && (
              <TouchableOpacity
                style={[styles.primaryButton, styles.takeOverButton]}
                onPress={() => onTakeOver(eventId)}
                disabled={isTakingOver}
              >
                {isTakingOver ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Take Shift</Text>
                )}
              </TouchableOpacity>
            )}

            {showClaim && (
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

            {showToggleComplete && event.kind === 'feeding' && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onMarkComplete(event)}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {eventIsComplete ? 'Mark Feeding Incomplete' : 'Mark Feeding Complete'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {showToggleComplete && event.kind === 'task' && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onMarkComplete(event)}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {eventIsComplete ? 'Mark Task Incomplete' : 'Mark Task Complete'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {showToggleComplete && event.kind === 'treatment' && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onMarkComplete(event)}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {eventIsComplete ? 'Mark Treatment Incomplete' : 'Mark Treatment Complete'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {showJoin && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onJoin(event)}
              >
                <Text style={styles.primaryButtonText}>Join Ride</Text>
              </TouchableOpacity>
            )}

            {showEdit && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => onEdit(event)}
              >
                <Text style={styles.secondaryButtonText}>{getEditLabel()}</Text>
              </TouchableOpacity>
            )}

            {showDelete && (
              <TouchableOpacity
                style={[styles.secondaryButton, styles.deleteButton]}
                onPress={() => onDelete(event)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#C0392B" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
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
  commentsSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E6ED',
  },
  commentsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 6,
  },
  commentsBody: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  actionSection: {
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3498DB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  claimButton: {
    backgroundColor: '#27AE60',
  },
  takeOverButton: {
    backgroundColor: '#E67E22',
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
  deleteButton: {
    borderColor: '#F5B7B1',
    backgroundColor: '#FDEDEC',
  },
  deleteButtonText: {
    color: '#C0392B',
    fontSize: 16,
    fontWeight: '700',
  },
});
