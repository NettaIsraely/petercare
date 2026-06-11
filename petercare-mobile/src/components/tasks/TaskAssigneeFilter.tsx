import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { UserSummary } from '../../types/user';
import { AssigneeFilter } from '../../utils/taskHelpers';

interface TaskAssigneeFilterProps {
  filter: AssigneeFilter;
  onChange: (filter: AssigneeFilter) => void;
  users: UserSummary[];
}

export default function TaskAssigneeFilter({
  filter,
  onChange,
  users,
}: TaskAssigneeFilterProps) {
  const chips: { key: AssigneeFilter; label: string; suggested?: boolean }[] = [
    { key: 'all', label: 'All' },
    { key: 'me', label: 'Assigned to me', suggested: true },
    { key: 'unassigned', label: 'Unassigned' },
    ...users.map((user) => ({ key: user.id, label: user.name })),
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Filter by assignee</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {chips.map(({ key, label, suggested }) => {
          const selected = filter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                selected && styles.chipSelected,
                suggested && !selected && styles.chipSuggested,
              ]}
              onPress={() => onChange(key)}
            >
              <Text
                style={[
                  styles.chipText,
                  selected && styles.chipTextSelected,
                  suggested && !selected && styles.chipTextSuggested,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  chipRow: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  chipSuggested: {
    borderColor: '#3498DB',
    backgroundColor: '#EBF5FB',
  },
  chipText: {
    fontSize: 13,
    color: '#2C3E50',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextSuggested: {
    color: '#2980B9',
    fontWeight: '600',
  },
});
