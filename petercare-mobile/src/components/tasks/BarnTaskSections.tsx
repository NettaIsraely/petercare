import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, ClipboardList } from 'lucide-react-native';
import { Task } from '../../types/task';
import { TimelineEvent } from '../../types/events';
import EventCard from '../home/EventCard';
import { isCompletingKey } from '../../utils/completionKeys';
import { taskToTimelineEvent } from '../../utils/taskHelpers';

interface BarnTaskSectionsProps {
  openTasks: Task[];
  completedTasks: Task[];
  currentUserId?: string;
  completingIds: Set<string>;
  onTaskPress: (event: TimelineEvent) => void;
  onMarkComplete: (task: Task) => void;
}

export default function BarnTaskSections({
  openTasks,
  completedTasks,
  currentUserId,
  completingIds,
  onTaskPress,
  onMarkComplete,
}: BarnTaskSectionsProps) {
  const [completedExpanded, setCompletedExpanded] = useState(completedTasks.length <= 5);

  const renderTask = (task: Task, completed: boolean) => {
    const event = taskToTimelineEvent(task);
    const canComplete =
      !completed &&
      !!task.assigned_user &&
      task.assigned_user.id === currentUserId &&
      !(task.is_complete ?? false);

    return (
      <EventCard
        key={task.id}
        event={event}
        showAssignee
        currentUserId={currentUserId}
        showCheckbox={canComplete}
        isCompleting={isCompletingKey(completingIds, 'task', task.id)}
        onToggleComplete={canComplete ? () => onMarkComplete(task) : undefined}
        onPress={() => onTaskPress(event)}
        completed={completed}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <ClipboardList size={20} color="#2C3E50" />
        <Text style={styles.sectionTitle}>Open Tasks</Text>
        <Text style={styles.countBadge}>{openTasks.length}</Text>
      </View>

      {openTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No open tasks match this filter.</Text>
        </View>
      ) : (
        openTasks.map((task) => renderTask(task, false))
      )}

      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setCompletedExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded: completedExpanded }}
      >
        <ClipboardList size={20} color="#7F8C8D" />
        <Text style={styles.completedSectionTitle}>Completed Tasks</Text>
        <Text style={styles.countBadgeMuted}>{completedTasks.length}</Text>
        {completedExpanded ? (
          <ChevronUp size={20} color="#7F8C8D" style={styles.chevron} />
        ) : (
          <ChevronDown size={20} color="#7F8C8D" style={styles.chevron} />
        )}
      </TouchableOpacity>

      {completedExpanded && (
        <>
          {completedTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No completed tasks match this filter.</Text>
            </View>
          ) : (
            completedTasks.map((task) => renderTask(task, true))
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  completedSectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#7F8C8D',
  },
  countBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3498DB',
    backgroundColor: '#EBF5FB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  countBadgeMuted: {
    fontSize: 13,
    fontWeight: '600',
    color: '#95A5A6',
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  chevron: {
    marginLeft: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E6ED',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});
