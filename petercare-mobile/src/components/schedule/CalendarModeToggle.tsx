import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarViewMode } from '../../types/events';

interface CalendarModeToggleProps {
  mode: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
}

export default function CalendarModeToggle({ mode, onChange }: CalendarModeToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, mode === 'weekly' && styles.optionActive]}
        onPress={() => onChange('weekly')}
      >
        <Text style={[styles.optionText, mode === 'weekly' && styles.optionTextActive]}>
          Weekly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, mode === 'monthly' && styles.optionActive]}
        onPress={() => onChange('monthly')}
      >
        <Text style={[styles.optionText, mode === 'monthly' && styles.optionTextActive]}>
          Monthly
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
    marginBottom: 12,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  optionTextActive: {
    color: '#3498DB',
  },
});
