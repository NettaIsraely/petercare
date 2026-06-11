import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react-native';
import {
  dateToTimeString,
  formatTimeLabel,
  timeStringToDate,
} from '../../utils/dateHelpers';

interface TimePickerFieldProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  optional?: boolean;
}

export default function TimePickerField({
  label,
  value,
  onChange,
  optional = false,
}: TimePickerFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  const pickerDate = useMemo(
    () => timeStringToDate(value || '08:00'),
    [value]
  );

  const displayText = value
    ? formatTimeLabel(value)
    : optional
      ? 'No time selected'
      : 'Select a time';

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      onChange(dateToTimeString(selectedDate));
    }
  };

  const handleRowPress = () => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(true);
      return;
    }
    setExpanded((prev) => !prev);
  };

  const handleClear = () => {
    onChange('');
    setExpanded(false);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.timeRow}>
          <Clock size={18} color="#3498DB" />
          <TextInput
            style={styles.timeText}
            value={value}
            onChangeText={onChange}
            placeholder={optional ? 'Optional HH:MM' : 'HH:MM'}
            placeholderTextColor="#95A5A6"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.timeRow}
        onPress={handleRowPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${displayText}`}
      >
        <Clock size={18} color="#3498DB" />
        <Text style={[styles.timeText, !value && optional && styles.timeTextPlaceholder]}>
          {displayText}
        </Text>
        {Platform.OS === 'ios' ? (
          expanded ? (
            <ChevronUp size={18} color="#7F8C8D" />
          ) : (
            <ChevronDown size={18} color="#7F8C8D" />
          )
        ) : null}
      </TouchableOpacity>

      {optional && value ? (
        <TouchableOpacity style={styles.clearChip} onPress={handleClear}>
          <Text style={styles.clearChipText}>Clear</Text>
        </TouchableOpacity>
      ) : null}

      {Platform.OS === 'ios' && expanded && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          display="spinner"
          is24Hour={false}
          onChange={handlePickerChange}
          style={styles.picker}
        />
      )}

      {Platform.OS === 'android' && showAndroidPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour={false}
          onChange={handlePickerChange}
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
  timeRow: {
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
  timeText: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '500',
  },
  timeTextPlaceholder: {
    color: '#95A5A6',
    fontWeight: '400',
  },
  clearChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  clearChipText: {
    fontSize: 13,
    color: '#2C3E50',
    fontWeight: '500',
  },
  picker: {
    marginTop: 8,
  },
});
