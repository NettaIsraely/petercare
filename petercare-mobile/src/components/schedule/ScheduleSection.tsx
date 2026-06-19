import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wheat, Route, Stethoscope, ClipboardList } from 'lucide-react-native';
import { TimelineEvent } from '../../types/events';
import { Task } from '../../types/task';
import { UserSummary } from '../../types/user';
import EventCard from '../home/EventCard';
import { isEventCompleted } from '../../utils/scheduleHelpers';

interface ScheduleSectionProps {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  events: TimelineEvent[];
  onEventPress: (event: TimelineEvent) => void;
  currentUserId?: string;
  users?: UserSummary[];
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
  emptyMessage?: string;
}

export default function ScheduleSection({
  title,
  icon: Icon,
  events,
  onEventPress,
  currentUserId,
  users,
  alertTimes,
  emptyMessage = 'No items yet.',
}: ScheduleSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon size={20} color="#2C3E50" />
        <Text style={styles.title}>{title}</Text>
      </View>
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        events.map((event) => (
          <EventCard
            key={`${event.kind}-${event.data.id}`}
            event={event}
            onPress={() => onEventPress(event)}
            currentUserId={currentUserId}
            showAssignee
            users={users}
            alertTimes={alertTimes}
            completed={isEventCompleted(event)}
          />
        ))
      )}
    </View>
  );
}

export function DatelessTasksSection({
  tasks,
  onTaskPress,
  currentUserId,
  users,
}: {
  tasks: Task[];
  onTaskPress: (event: TimelineEvent) => void;
  currentUserId?: string;
  users?: UserSummary[];
}) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ClipboardList size={20} color="#2C3E50" />
        <Text style={styles.title}>Master To-Do (No Deadline)</Text>
      </View>
      {tasks.map((task) => {
        const event: TimelineEvent = { kind: 'task', data: task, sortMinutes: 0 };
        return (
          <EventCard
            key={task.id}
            event={event}
            onPress={() => onTaskPress(event)}
            currentUserId={currentUserId}
            showAssignee
            users={users}
            completed={isEventCompleted(event)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E50',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});
