import React, { useEffect, useMemo, useState } from 'react';
import { formatUserFacingDate, toDateString } from '../../utils/dateHelpers';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react-native';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  optional?: boolean;
}

const CALENDAR_THEME = {
  todayTextColor: '#3498DB',
  arrowColor: '#3498DB',
  selectedDayBackgroundColor: '#3498DB',
};

export default function DatePickerField({
  label,
  value,
  onChange,
  optional = false,
}: DatePickerFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const today = toDateString(new Date());
  const [displayMonth, setDisplayMonth] = useState(value || today);

  useEffect(() => {
    if (value) {
      setDisplayMonth(value);
    }
  }, [value]);

  const markedDates = useMemo(() => {
    if (!value) {
      return undefined;
    }
    return {
      [value]: { selected: true, selectedColor: '#3498DB' },
    };
  }, [value]);

  const displayText = value
    ? formatUserFacingDate(value)
    : optional
      ? 'No date selected'
      : 'Select a date';

  const handleDayPress = (day: { dateString: string }) => {
    onChange(day.dateString);
    setExpanded(false);
  };

  const handleClear = () => {
    onChange('');
    setExpanded(false);
  };

  const handleToday = () => {
    onChange(today);
    setDisplayMonth(today);
  };

  const handleToggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (next) {
        setDisplayMonth(value || today);
      }
      return next;
    });
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dateRow}
        onPress={handleToggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${displayText}`}
      >
        <CalendarDays size={18} color="#3498DB" />
        <Text style={[styles.dateText, !value && optional && styles.dateTextPlaceholder]}>
          {displayText}
        </Text>
        {expanded ? (
          <ChevronUp size={18} color="#7F8C8D" />
        ) : (
          <ChevronDown size={18} color="#7F8C8D" />
        )}
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.chipRow}>
          <TouchableOpacity style={styles.actionChip} onPress={handleToday}>
            <Text style={styles.todayChipText}>Today</Text>
          </TouchableOpacity>
          {optional && value ? (
            <TouchableOpacity style={styles.actionChip} onPress={handleClear}>
              <Text style={styles.clearChipText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {expanded && (
        <Calendar
          initialDate={displayMonth}
          onMonthChange={(month) => setDisplayMonth(month.dateString)}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={CALENDAR_THEME}
          style={styles.calendar}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 6,
    marginTop: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '500',
  },
  dateTextPlaceholder: {
    color: '#95A5A6',
    fontWeight: '400',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  todayChipText: {
    fontSize: 13,
    color: '#3498DB',
    fontWeight: '600',
  },
  clearChipText: {
    fontSize: 13,
    color: '#2C3E50',
    fontWeight: '500',
  },
  calendar: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
});
