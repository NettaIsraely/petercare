import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { X } from 'lucide-react-native';
import DatePickerField from '../schedule/DatePickerField';
import {
  CreateHorsePayload,
  HorseColor,
  UpdateHorsePayload,
} from '../../types/horse';
import { getHorseIcon, HORSE_COLORS } from '../../utils/horseIcons';
import { normalizeDateString } from '../../utils/dateHelpers';

export interface HorseFormInitialValues {
  name: string;
  color: HorseColor;
  lastShoeingDate?: string | null;
}

type HorseFormModalProps = {
  visible: boolean;
  onClose: () => void;
  submitting: boolean;
} & (
  | {
      mode: 'create';
      onSubmit: (payload: CreateHorsePayload) => Promise<void>;
    }
  | {
      mode: 'edit';
      initialValues: HorseFormInitialValues;
      onSubmit: (payload: UpdateHorsePayload) => Promise<void>;
    }
);

export default function HorseFormModal(props: HorseFormModalProps) {
  const { visible, onClose, submitting, mode } = props;

  const [name, setName] = useState('');
  const [color, setColor] = useState<HorseColor | null>(null);
  const [lastShoeingDate, setLastShoeingDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setName('');
      setColor(null);
      setLastShoeingDate('');
      setError(null);
      return;
    }

    if (mode === 'edit') {
      setName(props.initialValues.name);
      setColor(props.initialValues.color);
      setLastShoeingDate(
        props.initialValues.lastShoeingDate
          ? normalizeDateString(props.initialValues.lastShoeingDate)
          : ''
      );
    }
  }, [visible, mode, mode === 'edit' ? props.initialValues : null]);

  const handleClose = () => {
    if (submitting) {
      return;
    }
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a horse name.');
      return;
    }
    if (!color) {
      setError('Please select a color.');
      return;
    }

    setError(null);
    try {
      if (mode === 'create') {
        await props.onSubmit({ name: trimmedName, color });
      } else {
        await props.onSubmit({
          name: trimmedName,
          color,
          last_shoeing_date: lastShoeingDate.trim() ? lastShoeingDate.trim() : null,
        });
      }
      onClose();
    } catch {
      setError(
        mode === 'create'
          ? 'Failed to create horse. Please try again.'
          : 'Failed to update horse. Please try again.'
      );
    }
  };

  const canSubmit = name.trim().length > 0 && color !== null && !submitting;
  const title = mode === 'create' ? 'New Horse' : 'Edit Horse';
  const submitLabel = mode === 'create' ? 'Add Horse' : 'Save Changes';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} accessibilityLabel="Close" disabled={submitting}>
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Horse name"
              placeholderTextColor="#BDC3C7"
              editable={!submitting}
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorGrid}>
              {HORSE_COLORS.map(({ value, label }) => {
                const selected = color === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.colorOption, selected && styles.colorOptionSelected]}
                    onPress={() => setColor(value)}
                    disabled={submitting}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                  >
                    <Image source={getHorseIcon(value)} style={styles.colorIcon} />
                    <Text style={[styles.colorLabel, selected && styles.colorLabelSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {mode === 'edit' ? (
              <>
                <DatePickerField
                  label="Last Shoeing Date"
                  value={lastShoeingDate}
                  onChange={setLastShoeingDate}
                  optional
                />
                {lastShoeingDate ? (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={() => setLastShoeingDate('')}
                    disabled={submitting}
                  >
                    <Text style={styles.clearDateText}>Clear date</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleClose}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>{submitLabel}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2C3E50',
    marginBottom: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  colorOption: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E6ED',
    gap: 8,
  },
  colorOptionSelected: {
    borderColor: '#3498DB',
    backgroundColor: '#EBF5FB',
  },
  colorIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  colorLabelSelected: {
    color: '#3498DB',
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  clearDateText: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3498DB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  secondaryButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 8,
  },
});
