import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wheat, ClipboardList, Check } from 'lucide-react-native';
import { Feeding } from '../../types/feeding';
import { Task } from '../../types/task';
import { PersonalChecklist } from '../../utils/insightsHelpers';
import { formatShiftLabel, normalizeDateString } from '../../utils/dateHelpers';

interface PersonalStatsChecklistProps {
  checklist: PersonalChecklist;
  isCurrentWeek?: boolean;
  weekLabel?: string;
}

function formatChecklistDate(value: string): string {
  const datePart = normalizeDateString(value);
  const date = new Date(`${datePart}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function ReadOnlyCheckbox({ isComplete }: { isComplete: boolean }) {
  return (
    <View
      style={[styles.checkbox, isComplete && styles.checkboxChecked]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isComplete }}
    >
      {isComplete && <Check size={16} color="#FFFFFF" />}
    </View>
  );
}

function FeedingRow({ feeding }: { feeding: Feeding }) {
  const isComplete = feeding.feeding_status === 'COMPLETE';

  return (
    <View style={styles.row}>
      <View style={styles.iconColumn}>
        <Wheat size={22} color="#2C3E50" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{formatShiftLabel(feeding.shift_type)}</Text>
        <Text style={styles.subtitle}>{formatChecklistDate(feeding.schedule_date)}</Text>
      </View>
      <ReadOnlyCheckbox isComplete={isComplete} />
    </View>
  );
}

function TaskRow({ task }: { task: Task }) {
  const isComplete = task.is_complete ?? false;

  return (
    <View style={styles.row}>
      <View style={styles.iconColumn}>
        <ClipboardList size={22} color="#2C3E50" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{task.name}</Text>
        <Text style={styles.subtitle}>
          {task.deadline ? formatChecklistDate(task.deadline) : 'No deadline'}
        </Text>
      </View>
      <ReadOnlyCheckbox isComplete={isComplete} />
    </View>
  );
}

export default function PersonalStatsChecklist({
  checklist,
  isCurrentWeek = true,
  weekLabel,
}: PersonalStatsChecklistProps) {
  const { feedings, tasks, summary } = checklist;
  const isEmpty = feedings.length === 0 && tasks.length === 0;
  const subtitle = isCurrentWeek
    ? 'Your assigned feedings and tasks this week'
    : `Your assigned feedings and tasks for ${weekLabel ?? 'this week'}`;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>My Weekly Stats</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>

      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <Text style={styles.pillCount}>
            {summary.feedingsComplete}/{summary.feedingsTotal}
          </Text>
          <Text style={styles.pillLabel}>Feedings</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillCount}>
            {summary.tasksComplete}/{summary.tasksTotal}
          </Text>
          <Text style={styles.pillLabel}>Tasks</Text>
        </View>
      </View>

      <View style={styles.card}>
        {isEmpty ? (
          <Text style={styles.emptyText}>Nothing assigned to you this week.</Text>
        ) : (
          <>
            {feedings.map((feeding) => (
              <FeedingRow key={feeding.id} feeding={feeding} />
            ))}
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </>
        )}
      </View>
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  pillCount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3498DB',
    marginBottom: 2,
  },
  pillLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
