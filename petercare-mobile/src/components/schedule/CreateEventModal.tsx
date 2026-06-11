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
} from 'react-native';
import { X, Wheat, Route, ClipboardList, Stethoscope } from 'lucide-react-native';
import { CreateEventCategory } from '../../types/events';
import { CreateFeedingPayload, ShiftType } from '../../types/feeding';
import { CreateTaskPayload } from '../../types/task';
import { CreateRidePayload } from '../../types/ride';
import {
  CreateTreatmentPayload,
  PREDEFINED_TREATMENT_NAMES,
  PredefinedTreatmentName,
} from '../../types/treatment';
import { Horse } from '../../types/horse';
import { UserSummary } from '../../types/user';
import DatePickerField from './DatePickerField';
import TimePickerField from '../common/TimePickerField';
import { formatTimeForApi, parseTimeToMinutes } from '../../utils/dateHelpers';
import {
  TaskFormFields,
  TaskFormValues,
  formValuesToCreatePayload,
  taskToFormValues,
} from '../tasks/TaskFormModal';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  defaultDate: string;
  horses: Horse[];
  users: UserSummary[];
  currentUserId?: string;
  creating: boolean;
  onCreateFeeding: (payload: CreateFeedingPayload) => Promise<void>;
  onCreateTask: (payload: CreateTaskPayload) => Promise<void>;
  onCreateRide: (payload: CreateRidePayload) => Promise<void>;
  onCreateTreatment: (payload: CreateTreatmentPayload) => Promise<void>;
}

const CATEGORIES: { key: CreateEventCategory; label: string; Icon: typeof Wheat }[] = [
  { key: 'feeding', label: 'Feeding', Icon: Wheat },
  { key: 'ride', label: 'Ride', Icon: Route },
  { key: 'treatment', label: 'Treatment', Icon: Stethoscope },
  { key: 'task', label: 'Task', Icon: ClipboardList },
];

function PickerRow({
  label,
  options,
  selectedId,
  onSelect,
  allowEmpty,
}: {
  label: string;
  options: { id: string; label: string }[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  allowEmpty?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {allowEmpty && (
          <TouchableOpacity
            style={[styles.chip, !selectedId && styles.chipSelected]}
            onPress={() => onSelect(undefined)}
          >
            <Text style={[styles.chipText, !selectedId && styles.chipTextSelected]}>None</Text>
          </TouchableOpacity>
        )}
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.chip, selectedId === option.id && styles.chipSelected]}
            onPress={() => onSelect(option.id)}
          >
            <Text
              style={[styles.chipText, selectedId === option.id && styles.chipTextSelected]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function CreateEventModal({
  visible,
  onClose,
  defaultDate,
  horses,
  users,
  currentUserId,
  creating,
  onCreateFeeding,
  onCreateTask,
  onCreateRide,
  onCreateTreatment,
}: CreateEventModalProps) {
  const [category, setCategory] = useState<CreateEventCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userOptions = users.map((u) => ({ id: u.id, label: u.name }));
  const horseOptions = horses.filter((h) => h.is_active).map((h) => ({ id: h.id, label: h.name }));

  const [feedingDate, setFeedingDate] = useState(defaultDate);
  const [shiftType, setShiftType] = useState<ShiftType>('MORNING');
  const [feedingAssignee, setFeedingAssignee] = useState<string | undefined>();

  const [taskValues, setTaskValues] = useState<TaskFormValues>(taskToFormValues());

  const [rideDate, setRideDate] = useState(defaultDate);
  const [rideStart, setRideStart] = useState('09:00');
  const [rideEnd, setRideEnd] = useState('10:00');
  const [primaryRiderId, setPrimaryRiderId] = useState(currentUserId ?? '');
  const [selectedHorseIds, setSelectedHorseIds] = useState<string[]>([]);
  const [additionalRiderIds, setAdditionalRiderIds] = useState<string[]>([]);

  const [treatmentNamePreset, setTreatmentNamePreset] = useState<PredefinedTreatmentName | null>(
    null
  );
  const [treatmentCustomName, setTreatmentCustomName] = useState('');
  const [treatmentDate, setTreatmentDate] = useState(defaultDate);
  const [treatmentDuration, setTreatmentDuration] = useState('');
  const [treatmentHorseIds, setTreatmentHorseIds] = useState<string[]>([]);
  const [treatmentUserId, setTreatmentUserId] = useState(currentUserId ?? '');

  const resetForm = () => {
    setCategory(null);
    setError(null);
    setFeedingDate(defaultDate);
    setShiftType('MORNING');
    setFeedingAssignee(undefined);
    setTaskValues(taskToFormValues());
    setRideDate(defaultDate);
    setRideStart('09:00');
    setRideEnd('10:00');
    setPrimaryRiderId(currentUserId ?? '');
    setSelectedHorseIds([]);
    setAdditionalRiderIds([]);
    setTreatmentNamePreset(null);
    setTreatmentCustomName('');
    setTreatmentDate(defaultDate);
    setTreatmentDuration('');
    setTreatmentHorseIds([]);
    setTreatmentUserId(currentUserId ?? '');
  };

  useEffect(() => {
    if (!visible) {
      return;
    }
    setFeedingDate(defaultDate);
    setRideDate(defaultDate);
    setTreatmentDate(defaultDate);
  }, [visible, defaultDate]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleHorse = (horseId: string) => {
    setSelectedHorseIds((prev) =>
      prev.includes(horseId) ? prev.filter((id) => id !== horseId) : [...prev, horseId]
    );
  };

  const toggleAdditionalRider = (userId: string) => {
    setAdditionalRiderIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleTreatmentHorse = (horseId: string) => {
    setTreatmentHorseIds((prev) =>
      prev.includes(horseId) ? prev.filter((id) => id !== horseId) : [...prev, horseId]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (category === 'feeding') {
        await onCreateFeeding({
          schedule_date: feedingDate.trim(),
          shift_type: shiftType,
          assigned_user_id: feedingAssignee,
        });
      } else if (category === 'task') {
        if (!taskValues.name.trim()) {
          setError('Task name is required.');
          return;
        }
        await onCreateTask(formValuesToCreatePayload(taskValues));
      } else if (category === 'ride') {
        if (!primaryRiderId) {
          setError('Primary rider is required.');
          return;
        }
        if (selectedHorseIds.length === 0) {
          setError('Select at least one horse.');
          return;
        }
        const startTime = formatTimeForApi(rideStart);
        const endTime = formatTimeForApi(rideEnd);
        if (!startTime || !endTime) {
          setError('Start and end times are required.');
          return;
        }
        if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
          setError('End time must be after start time.');
          return;
        }
        await onCreateRide({
          date: rideDate.trim(),
          start_time: startTime,
          end_time: endTime,
          primary_rider_id: primaryRiderId,
          horses: selectedHorseIds,
          additional_riders_ids:
            additionalRiderIds.length > 0 ? additionalRiderIds : undefined,
        });
      } else if (category === 'treatment') {
        const resolvedTreatmentName = treatmentNamePreset ?? treatmentCustomName.trim();
        if (!resolvedTreatmentName) {
          setError('Treatment name is required.');
          return;
        }
        if (treatmentHorseIds.length === 0) {
          setError('Select at least one horse.');
          return;
        }
        if (!treatmentUserId) {
          setError('Select a staff member.');
          return;
        }
        await onCreateTreatment({
          name: resolvedTreatmentName,
          date: treatmentDate.trim() || undefined,
          duration_minutes: treatmentDuration.trim()
            ? parseInt(treatmentDuration, 10)
            : undefined,
          horse_ids: treatmentHorseIds,
          user_id: treatmentUserId,
        });
      }
      handleClose();
    } catch {
      setError('Failed to create event. Please check your inputs and try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {category ? `New ${category.charAt(0).toUpperCase()}${category.slice(1)}` : 'Create Event'}
            </Text>
            <TouchableOpacity onPress={handleClose} accessibilityLabel="Close">
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {!category && (
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(({ key, label, Icon }) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.categoryCard}
                    onPress={() => setCategory(key)}
                  >
                    <Icon size={28} color="#3498DB" />
                    <Text style={styles.categoryLabel}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {category === 'feeding' && (
              <>
                <DatePickerField
                  label="Schedule Date"
                  value={feedingDate}
                  onChange={setFeedingDate}
                />
                <Text style={styles.label}>Shift</Text>
                <View style={styles.row}>
                  {(['MORNING', 'EVENING'] as ShiftType[]).map((shift) => (
                    <TouchableOpacity
                      key={shift}
                      style={[styles.chip, shiftType === shift && styles.chipSelected]}
                      onPress={() => setShiftType(shift)}
                    >
                      <Text
                        style={[styles.chipText, shiftType === shift && styles.chipTextSelected]}
                      >
                        {shift}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <PickerRow
                  label="Assign to (optional)"
                  options={userOptions}
                  selectedId={feedingAssignee}
                  onSelect={setFeedingAssignee}
                  allowEmpty
                />
              </>
            )}

            {category === 'task' && (
              <TaskFormFields values={taskValues} onChange={setTaskValues} users={users} />
            )}

            {category === 'ride' && (
              <>
                <DatePickerField label="Date" value={rideDate} onChange={setRideDate} />
                <TimePickerField label="Start Time" value={rideStart} onChange={setRideStart} />
                <TimePickerField label="End Time" value={rideEnd} onChange={setRideEnd} />
                <PickerRow
                  label="Primary Rider"
                  options={userOptions}
                  selectedId={primaryRiderId}
                  onSelect={(id) => setPrimaryRiderId(id ?? '')}
                />
                <View style={styles.field}>
                  <Text style={styles.label}>Horses</Text>
                  <View style={styles.rowWrap}>
                    {horseOptions.map((horse) => (
                      <TouchableOpacity
                        key={horse.id}
                        style={[
                          styles.chip,
                          selectedHorseIds.includes(horse.id) && styles.chipSelected,
                        ]}
                        onPress={() => toggleHorse(horse.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selectedHorseIds.includes(horse.id) && styles.chipTextSelected,
                          ]}
                        >
                          {horse.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Additional Riders (optional)</Text>
                  <View style={styles.rowWrap}>
                    {userOptions
                      .filter((u) => u.id !== primaryRiderId)
                      .map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          style={[
                            styles.chip,
                            additionalRiderIds.includes(user.id) && styles.chipSelected,
                          ]}
                          onPress={() => toggleAdditionalRider(user.id)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              additionalRiderIds.includes(user.id) && styles.chipTextSelected,
                            ]}
                          >
                            {user.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              </>
            )}

            {category === 'treatment' && (
              <>
                <Text style={styles.label}>Name</Text>
                <View style={styles.rowWrap}>
                  {PREDEFINED_TREATMENT_NAMES.map((name) => (
                    <TouchableOpacity
                      key={name}
                      style={[styles.chip, treatmentNamePreset === name && styles.chipSelected]}
                      onPress={() => {
                        setTreatmentNamePreset(name);
                        setTreatmentCustomName('');
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          treatmentNamePreset === name && styles.chipTextSelected,
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  value={treatmentCustomName}
                  onChangeText={(text) => {
                    setTreatmentCustomName(text);
                    setTreatmentNamePreset(null);
                  }}
                  placeholder="Or enter custom name"
                  placeholderTextColor="#BDC3C7"
                />
                <DatePickerField label="Date" value={treatmentDate} onChange={setTreatmentDate} />
                <Text style={styles.label}>Duration (minutes, optional)</Text>
                <TextInput
                  style={styles.input}
                  value={treatmentDuration}
                  onChangeText={setTreatmentDuration}
                  keyboardType="number-pad"
                />
                <View style={styles.field}>
                  <Text style={styles.label}>Horses</Text>
                  <View style={styles.rowWrap}>
                    {horseOptions.map((horse) => (
                      <TouchableOpacity
                        key={horse.id}
                        style={[
                          styles.chip,
                          treatmentHorseIds.includes(horse.id) && styles.chipSelected,
                        ]}
                        onPress={() => toggleTreatmentHorse(horse.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            treatmentHorseIds.includes(horse.id) && styles.chipTextSelected,
                          ]}
                        >
                          {horse.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <PickerRow
                  label="Staff"
                  options={userOptions}
                  selectedId={treatmentUserId}
                  onSelect={(id) => setTreatmentUserId(id ?? '')}
                />
              </>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {category && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setCategory(null)}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSubmit}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  field: {
    marginBottom: 12,
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
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipRow: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  chipText: {
    fontSize: 13,
    color: '#2C3E50',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
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
