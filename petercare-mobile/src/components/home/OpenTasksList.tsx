import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Task } from '../../types/task';
import { isCompletingKey } from '../../utils/completionKeys';
import { eventHasComments } from '../../utils/scheduleHelpers';
import { OpenTaskCard } from './EventCard';

interface OpenTasksListProps {
  tasks: Task[];
  onMarkComplete: (task: Task) => void;
  completingIds: Set<string>;
}

export default function OpenTasksList({
  tasks,
  onMarkComplete,
  completingIds,
}: OpenTasksListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Additional Tasks</Text>
      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No other tasks</Text>
        </View>
      ) : (
        tasks.map((task) => (
          <OpenTaskCard
            key={task.id}
            name={task.name}
            assignedUserId={task.assigned_user?.id}
            hasComments={eventHasComments({ kind: 'task', data: task })}
            isCompleting={isCompletingKey(completingIds, 'task', task.id)}
            onToggleComplete={() => onMarkComplete(task)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});
