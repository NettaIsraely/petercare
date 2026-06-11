import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScheduleViewMode } from '../../types/events';

interface ViewToggleBarProps {
  mode: ScheduleViewMode;
  onChange: (mode: ScheduleViewMode) => void;
}

export default function ViewToggleBar({ mode, onChange }: ViewToggleBarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, mode === 'calendar' && styles.optionActive]}
        onPress={() => onChange('calendar')}
      >
        <Text style={[styles.optionText, mode === 'calendar' && styles.optionTextActive]}>
          Calendar View
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, mode === 'list' && styles.optionActive]}
        onPress={() => onChange('list')}
      >
        <Text style={[styles.optionText, mode === 'list' && styles.optionTextActive]}>
          List View
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E8EDF2',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  optionTextActive: {
    color: '#3498DB',
  },
});
