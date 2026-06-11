import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import { TimelineEvent } from '../../types/events';
import { getEventCardStyle } from '../../utils/userColors';
import {
  getAssigneeName,
  getAssignedUserId,
  isEventOwnedByUser,
  isUnassignedFeeding,
} from '../../utils/scheduleHelpers';
import EventTypeIcon from '../schedule/EventTypeIcon';
import {
  formatShiftLabel,
  formatTimeLabel,
  getShiftDeadlineTime,
  isToday,
  normalizeDateString,
} from '../../utils/dateHelpers';

interface EventCardProps {
  event: TimelineEvent;
  showCheckbox?: boolean;
  isCompleting?: boolean;
  onToggleComplete?: () => void;
  onPress?: () => void;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
  currentUserId?: string;
  showAssignee?: boolean;
}

function getEventTitle(event: TimelineEvent): string {
  switch (event.kind) {
    case 'feeding':
      return formatShiftLabel(event.data.shift_type);
    case 'ride':
      return `Ride with ${event.data.horses.map((h) => h.name).join(', ')}`;
    case 'treatment':
      return `${event.data.name} — ${event.data.horse.name}`;
    case 'task':
      return event.data.name;
    default:
      return '';
  }
}

function getEventSubtitle(event: TimelineEvent, alertTimes?: EventCardProps['alertTimes']): string {
  switch (event.kind) {
    case 'feeding': {
      const time = getShiftDeadlineTime(
        event.data.shift_type,
        alertTimes?.morningTime,
        alertTimes?.eveningTime
      );
      const timeLabel = formatTimeLabel(time);
      return isToday(event.data.schedule_date)
        ? timeLabel
        : `${normalizeDateString(event.data.schedule_date)} · ${timeLabel}`;
    }
    case 'ride': {
      const timeRange = `${formatTimeLabel(event.data.start_time)} – ${formatTimeLabel(event.data.end_time)}`;
      return isToday(event.data.date)
        ? timeRange
        : `${normalizeDateString(event.data.date)} · ${timeRange}`;
    }
    case 'treatment': {
      const durationLabel = event.data.duration_minutes
        ? `${event.data.duration_minutes} min`
        : 'Scheduled';
      return isToday(event.data.date)
        ? durationLabel
        : `${normalizeDateString(event.data.date)} · ${durationLabel}`;
    }
    case 'task':
      if (event.data.deadline) {
        const deadline = normalizeDateString(event.data.deadline);
        return isToday(deadline) ? 'Due today' : `Due ${deadline}`;
      }
      return 'No deadline';
    default:
      return '';
  }
}

export default function EventCard({
  event,
  showCheckbox = false,
  isCompleting = false,
  onToggleComplete,
  onPress,
  alertTimes,
  currentUserId,
  showAssignee = false,
}: EventCardProps) {
  const assignedUserId = getAssignedUserId(event);
  const isCurrentUser = isEventOwnedByUser(event, currentUserId);
  const cardStyle = getEventCardStyle({
    assignedUserId,
    isUnassignedFeeding: isUnassignedFeeding(event),
    isCurrentUser: showAssignee ? isCurrentUser : false,
  });
  const assigneeName = showAssignee ? getAssigneeName(event) : undefined;
  const titleWeight = showAssignee
    ? isCurrentUser
      ? '700'
      : '500'
    : '600';

  const content = (
    <>
      <View style={styles.iconColumn}>
        <EventTypeIcon event={event} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { fontWeight: titleWeight }]}>
          {getEventTitle(event)}
        </Text>
        <Text style={styles.subtitle}>{getEventSubtitle(event, alertTimes)}</Text>
        {assigneeName ? (
          <Text style={styles.assignee}>{assigneeName}</Text>
        ) : null}
      </View>
      {showCheckbox && (
        <TouchableOpacity
          style={[styles.checkbox, isCompleting && styles.checkboxLoading]}
          onPress={onToggleComplete}
          disabled={isCompleting}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: false, busy: isCompleting }}
        >
          {isCompleting && <ActivityIndicator size="small" color="#3498DB" />}
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.card, cardStyle]}
        onPress={onPress}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, cardStyle]}>{content}</View>;
}

export function OpenTaskCard({
  name,
  assignedUserId,
  isCompleting,
  onToggleComplete,
}: {
  name: string;
  assignedUserId?: string;
  isCompleting: boolean;
  onToggleComplete: () => void;
}) {
  const cardStyle = getEventCardStyle({ assignedUserId });

  return (
    <View style={[styles.card, cardStyle]}>
      <View style={styles.iconColumn}>
        <ClipboardList size={22} color="#2C3E50" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>No deadline</Text>
      </View>
      <TouchableOpacity
        style={[styles.checkbox, isCompleting && styles.checkboxLoading]}
        onPress={onToggleComplete}
        disabled={isCompleting}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: false, busy: isCompleting }}
      >
        {isCompleting && <ActivityIndicator size="small" color="#3498DB" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  iconColumn: {
    marginRight: 12,
    minWidth: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  assignee: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 4,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3498DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkboxLoading: {
    borderColor: '#AED6F1',
  },
});
