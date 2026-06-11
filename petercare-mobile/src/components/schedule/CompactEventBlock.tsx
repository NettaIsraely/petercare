import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { TimelineEvent } from '../../types/events';
import { getEventCardStyle } from '../../utils/userColors';
import {
  getAssigneeName,
  getAssignedUserId,
  isEventOwnedByUser,
  isUnassignedFeeding,
} from '../../utils/scheduleHelpers';
import {
  formatShiftLabel,
  formatTimeLabel,
  getShiftDeadlineTime,
} from '../../utils/dateHelpers';
import EventTypeIcon from './EventTypeIcon';

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
  const isCurrentUser = isEventOwnedByUser(event, currentUserId);
  const cardStyle = getEventCardStyle({
    assignedUserId,
    isUnassignedFeeding: isUnassignedFeeding(event),
    isCurrentUser,
  });
  const assigneeName = getAssigneeName(event);
  const subtitle = getCompactSubtitle(event, alertTimes);
  const titleWeight = isCurrentUser ? '700' : '500';

  return (
    <Pressable
      style={[styles.block, cardStyle]}
      onPress={onPress}
      accessibilityRole="button"
    >
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
          <Text style={[styles.title, { fontWeight: titleWeight }]} numberOfLines={2}>
            {getCompactTitle(event)}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {assigneeName ? (
            <Text style={styles.assignee} numberOfLines={1}>
              {assigneeName}
            </Text>
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
  title: {
    fontSize: 11,
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 10,
    color: '#7F8C8D',
    marginTop: 2,
  },
  assignee: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 2,
  },
});
