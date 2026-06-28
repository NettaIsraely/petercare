import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Check, MessageSquare } from 'lucide-react-native';
import { getDisplayAdditionalRiders } from '../../types/ride';
import { getEventCardStyle } from '../../utils/userColors';
import {
  getAssigneeName,
  getAssignedUserId,
  getColorUserForEvent,
  isEventOwnedByUser,
  isUnassignedFeeding,
  eventHasComments,
  isEventCompleted,
} from '../../utils/scheduleHelpers';
import {
  formatShiftLabel,
  formatTimeLabel,
  getShiftDeadlineTime,
} from '../../utils/dateHelpers';
import EventTypeIcon from './EventTypeIcon';
import AdditionalRiderDots from './AdditionalRiderDots';

interface CompactEventBlockProps {
  event: TimelineEvent;
  onPress: () => void;
  currentUserId?: string;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

function getCompactTitle(event: TimelineEvent): string {
  switch (event.kind) {
    case 'feeding':
      return formatShiftLabel(event.data.shift_type);
    case 'ride':
      return `Ride`;
    case 'treatment':
      return event.data.name;
    case 'task':
      return event.data.name;
    default:
      return '';
  }
}

function getCompactSubtitle(
  event: TimelineEvent,
  alertTimes?: CompactEventBlockProps['alertTimes']
): string | undefined {
  switch (event.kind) {
    case 'feeding': {
      const time = getShiftDeadlineTime(
        event.data.shift_type,
        alertTimes?.morningTime,
        alertTimes?.eveningTime
      );
      return formatTimeLabel(time);
    }
    case 'ride':
      return `${formatTimeLabel(event.data.start_time)} – ${formatTimeLabel(event.data.end_time)}`;
    default:
      return undefined;
  }
}

export default function CompactEventBlock({
  event,
  onPress,
  currentUserId,
  alertTimes,
}: CompactEventBlockProps) {
  const assignedUserId = getAssignedUserId(event);
  const colorUser = getColorUserForEvent(event);
  const isCurrentUser = isEventOwnedByUser(event, currentUserId);
  const cardStyle = getEventCardStyle({
    assignedUserId,
    colorUser,
    isUnassignedFeeding: isUnassignedFeeding(event),
    isCurrentUser,
  });
  const assigneeName = getAssigneeName(event);
  const additionalRiders = event.kind === 'ride' ? getDisplayAdditionalRiders(event.data) : [];
  const subtitle = getCompactSubtitle(event, alertTimes);
  const titleWeight = isCurrentUser ? '700' : '500';
  const hasComments = eventHasComments(event);
  const completed = isEventCompleted(event);

  return (
    <Pressable
      style={[styles.block, cardStyle, completed && styles.completedBlock]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {completed && (
        <View style={styles.completedBadge} accessibilityLabel="Completed">
          <Check size={10} color="#27AE60" />
        </View>
      )}
      <View style={styles.row}>
        <View style={styles.iconColumn}>
          <EventTypeIcon
            event={event}
            size={14}
            horseIconSize={16}
            maxHorseVisible={2}
          />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { fontWeight: titleWeight },
                completed && styles.completedTitle,
              ]}
              numberOfLines={2}
            >
              {getCompactTitle(event)}
            </Text>
            {hasComments && (
              <View style={styles.commentsMarker} accessibilityLabel="Has comments">
                <MessageSquare size={11} color="#95A5A6" />
              </View>
            )}
          </View>
          {subtitle ? (
            <Text
              style={[styles.subtitle, completed && styles.completedSubtitle]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
          {assigneeName ? (
            <Text
              style={[styles.assignee, styles.assigneeBold, completed && styles.completedSubtitle]}
              numberOfLines={1}
            >
              {assigneeName}
            </Text>
          ) : null}
          {additionalRiders.length > 0 ? (
            <AdditionalRiderDots riders={additionalRiders} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: 8,
    padding: 6,
    marginBottom: 4,
    position: 'relative',
  },
  completedBlock: {
    opacity: 0.75,
  },
  completedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconColumn: {
    marginRight: 4,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  title: {
    flex: 1,
    fontSize: 11,
    color: '#2C3E50',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#95A5A6',
  },
  commentsMarker: {
    marginTop: 1,
  },
  subtitle: {
    fontSize: 10,
    color: '#7F8C8D',
    marginTop: 2,
  },
  completedSubtitle: {
    color: '#BDC3C7',
  },
  assignee: {
    fontSize: 10,
    color: '#2C3E50',
    marginTop: 2,
  },
  assigneeBold: {
    fontWeight: '700',
  },
});
