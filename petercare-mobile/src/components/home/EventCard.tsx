import React from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Wheat, Route, ClipboardList, Stethoscope, Check } from 'lucide-react-native';
import { TimelineEvent } from '../../types/events';
import { getEventCardStyle } from '../../utils/userColors';
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
  isComplete?: boolean;
  onToggleComplete?: () => void;
  onPress?: () => void;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

function getAssignedUserId(event: TimelineEvent): string | undefined {
  switch (event.kind) {
    case 'feeding':
      return event.data.assigned_user?.id;
    case 'task':
      return event.data.assigned_user?.id;
    case 'ride':
      return event.data.primary_rider.id;
    case 'treatment':
      return event.data.user.id;
    default:
      return undefined;
  }
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

function CategoryIcon({ kind }: { kind: TimelineEvent['kind'] }) {
  const size = 22;
  const color = '#2C3E50';

  switch (kind) {
    case 'feeding':
      return <Wheat size={size} color={color} />;
    case 'ride':
      return <Route size={size} color={color} />;
    case 'task':
      return <ClipboardList size={size} color={color} />;
    case 'treatment':
      return <Stethoscope size={size} color={color} />;
    default:
      return null;
  }
}

export default function EventCard({
  event,
  showCheckbox = false,
  isComplete = false,
  onToggleComplete,
  onPress,
  alertTimes,
}: EventCardProps) {
  const assignedUserId = getAssignedUserId(event);
  const cardStyle = getEventCardStyle(assignedUserId);

  const content = (
    <>
      <View style={styles.iconColumn}>
        <CategoryIcon kind={event.kind} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{getEventTitle(event)}</Text>
        <Text style={styles.subtitle}>{getEventSubtitle(event, alertTimes)}</Text>
      </View>
      {showCheckbox && (
        <TouchableOpacity
          style={[styles.checkbox, isComplete && styles.checkboxChecked]}
          onPress={onToggleComplete}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isComplete }}
        >
          {isComplete && <Check size={16} color="#FFFFFF" />}
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
  isComplete,
  onToggleComplete,
}: {
  name: string;
  assignedUserId?: string;
  isComplete: boolean;
  onToggleComplete: () => void;
}) {
  const cardStyle = getEventCardStyle(assignedUserId);

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
        style={[styles.checkbox, isComplete && styles.checkboxChecked]}
        onPress={onToggleComplete}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isComplete }}
      >
        {isComplete && <Check size={16} color="#FFFFFF" />}
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
  checkboxChecked: {
    backgroundColor: '#3498DB',
  },
});
