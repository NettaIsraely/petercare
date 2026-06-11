import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  Pressable,
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
  minimumTime?: string;
  maximumTime?: string;
}

let activeClosePicker: (() => void) | null = null;

function closeActiveTimePicker() {
  if (activeClosePicker) {
    const close = activeClosePicker;
    activeClosePicker = null;
    close();
  }
}

function registerActiveTimePicker(close: () => void) {
  closeActiveTimePicker();
  activeClosePicker = close;
}

function unregisterActiveTimePicker(close: () => void) {
  if (activeClosePicker === close) {
    activeClosePicker = null;
  }
}

export default function TimePickerField({
  label,
  value,
  onChange,
  optional = false,
  minimumTime,
  maximumTime,
}: TimePickerFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  const collapse = useCallback(() => setExpanded(false), []);

  const pickerDate = useMemo(
    () => timeStringToDate(value || '08:00'),
    [value]
  );

  const pickerBounds = useMemo(() => {
    if (!minimumTime && !maximumTime) {
      return undefined;
    }
    return {
      minimumDate: timeStringToDate(minimumTime ?? '00:00'),
      maximumDate: timeStringToDate(maximumTime ?? '23:59'),
    };
  }, [minimumTime, maximumTime]);

  const displayText = value
    ? formatTimeLabel(value)
    : optional
      ? 'No time selected'
      : 'Select a time';

  useEffect(() => {
    if (!expanded) {
      return;
    }
    registerActiveTimePicker(collapse);
    return () => unregisterActiveTimePicker(collapse);
  }, [expanded, collapse]);

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
    setExpanded((prev) => {
      if (prev) {
        return false;
      }
      closeActiveTimePicker();
      return true;
    });
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

      {Platform.OS === 'ios' && (
        <Modal
          visible={expanded}
          transparent
          animationType="fade"
          onRequestClose={collapse}
        >
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={collapse} />
            <Pressable style={styles.pickerSheet} onPress={() => {}}>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                is24Hour={false}
                onChange={handlePickerChange}
                themeVariant="light"
                textColor="#000000"
                style={styles.picker}
                minimumDate={pickerBounds?.minimumDate}
                maximumDate={pickerBounds?.maximumDate}
              />
            </Pressable>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showAndroidPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour={false}
          onChange={handlePickerChange}
          minimumDate={pickerBounds?.minimumDate}
          maximumDate={pickerBounds?.maximumDate}
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
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  picker: {
    height: 216,
  },
});
