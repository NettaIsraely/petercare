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
import { Feeding } from '../../types/feeding';
import { UserRole } from '../../types/auth';
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
import {
  clampRideEndTime,
  deriveMaxRideStartTime,
  deriveRideEndFromStart,
  END_OF_DAY_TIME,
  formatTimeForApi,
  formatShiftLabel,
  formatWeekDayHeader,
  isValidTimeInput,
  minutesToTimeString,
  parseTimeToMinutes,
  RIDE_DEFAULT_DURATION_MINUTES,
} from '../../utils/dateHelpers';
import {
  TaskFormFields,
  TaskFormValues,
  formValuesToCreatePayload,
  taskToFormValues,
} from '../tasks/TaskFormModal';
import RideSchedulingConflictBanner from './RideSchedulingConflictBanner';
import {
  getApiErrorMessage,
  getConflictHorseNames,
  parseRideSchedulingConflict,
  RideConflictDetails,
} from '../../utils/rideConflictHelpers';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  defaultDate: string;
  horses: Horse[];
  users: UserSummary[];
  currentUserId?: string;
  userRole?: UserRole;
  creating: boolean;
  volunteering: boolean;
  unassignedFeedings: Feeding[];
  onVolunteerForFeedings: (feedingIds: string[]) => Promise<void>;
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
  userRole,
  creating,
  volunteering,
  unassignedFeedings,
  onVolunteerForFeedings,
  onCreateTask,
  onCreateRide,
  onCreateTreatment,
}: CreateEventModalProps) {
  const [category, setCategory] = useState<CreateEventCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rideConflict, setRideConflict] = useState<RideConflictDetails | null>(null);
  const [selectedFeedingIds, setSelectedFeedingIds] = useState<string[]>([]);

  const userOptions = users.map((u) => ({ id: u.id, label: u.name }));
  const horseOptions = horses.filter((h) => h.is_active).map((h) => ({ id: h.id, label: h.name }));
  const isGuest = userRole === 'GUEST';

  const [taskValues, setTaskValues] = useState<TaskFormValues>(taskToFormValues());

  const [rideDate, setRideDate] = useState(defaultDate);
  const [rideStart, setRideStart] = useState('09:00');
  const [rideEnd, setRideEnd] = useState('10:00');
  const [rideDurationMinutes, setRideDurationMinutes] = useState(RIDE_DEFAULT_DURATION_MINUTES);
  const [primaryRiderId, setPrimaryRiderId] = useState(currentUserId ?? '');
  const [selectedHorseIds, setSelectedHorseIds] = useState<string[]>([]);
  const [additionalRiderIds, setAdditionalRiderIds] = useState<string[]>([]);
  const [rideComments, setRideComments] = useState('');

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
    setRideConflict(null);
    setSelectedFeedingIds([]);
    setTaskValues(taskToFormValues());
    setRideDate(defaultDate);
    setRideStart('09:00');
    setRideEnd('10:00');
    setRideDurationMinutes(RIDE_DEFAULT_DURATION_MINUTES);
    setPrimaryRiderId(currentUserId ?? '');
    setSelectedHorseIds([]);
    setAdditionalRiderIds([]);
    setRideComments('');
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
    setRideDate(defaultDate);
    setTreatmentDate(defaultDate);
    setSelectedFeedingIds([]);
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

  const toggleFeedingSelection = (feedingId: string) => {
    setSelectedFeedingIds((prev) =>
      prev.includes(feedingId)
        ? prev.filter((id) => id !== feedingId)
        : [...prev, feedingId]
    );
  };

  const handleRideStartChange = (newStart: string) => {
    setRideStart(newStart);
    if (!isValidTimeInput(newStart)) {
      return;
    }
    const newEnd = deriveRideEndFromStart(newStart, rideDurationMinutes);
    setRideEnd(newEnd);
    setRideDurationMinutes(parseTimeToMinutes(newEnd) - parseTimeToMinutes(newStart));
  };

  const handleRideEndChange = (newEnd: string) => {
    if (!isValidTimeInput(newEnd) || !isValidTimeInput(rideStart)) {
      setRideEnd(newEnd);
      return;
    }
    const clampedEnd = clampRideEndTime(rideStart, newEnd);
    setRideEnd(clampedEnd);
    setRideDurationMinutes(parseTimeToMinutes(clampedEnd) - parseTimeToMinutes(rideStart));
  };

  const handleSubmit = async () => {
    setError(null);
    setRideConflict(null);
    try {
      if (category === 'feeding') {
        if (selectedFeedingIds.length === 0) {
          setError('Select at least one feeding shift.');
          return;
        }
        await onVolunteerForFeedings(selectedFeedingIds);
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
          comments: rideComments.trim() || undefined,
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
    } catch (err: unknown) {
      if (category === 'ride') {
        const conflicts = parseRideSchedulingConflict(err);
        if (conflicts) {
          setRideConflict(conflicts);
          return;
        }
      }

      setError(
        getApiErrorMessage(
          err,
          category === 'feeding'
            ? 'Failed to volunteer for feeding shifts. Please try again.'
            : category === 'ride'
              ? 'One or more horses or riders are already scheduled for this time.'
              : 'Failed to create event. Please check your inputs and try again.'
        )
      );
    }
  };

  const getCategoryTitle = () => {
    if (!category) {
      return 'Create Event';
    }
    if (category === 'feeding') {
      return 'Volunteer for Feeding';
    }
    return `New ${category.charAt(0).toUpperCase()}${category.slice(1)}`;
  };

  const isSubmitting = category === 'feeding' ? volunteering : creating;
  const submitLabel = category === 'feeding' ? 'Volunteer' : 'Create';
  const canSubmitFeeding = !isGuest && selectedFeedingIds.length > 0 && !volunteering;
  const conflictHorseNames = rideConflict ? getConflictHorseNames(rideConflict) : new Set<string>();

  const actionButtons = category ? (
    <View style={styles.actions}>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => setCategory(null)}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.primaryButton,
          category === 'feeding' && !canSubmitFeeding && styles.primaryButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting || (category === 'feeding' && (isGuest || !canSubmitFeeding))}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  ) : null;

  const feedingContent = (
    <>
      {isGuest ? (
        <Text style={styles.guestMessage}>
          Guests can view the stable. Request caregiver access to volunteer for shifts.
        </Text>
      ) : unassignedFeedings.length === 0 ? (
        <Text style={styles.emptyMessage}>
          No unassigned feeding shifts in the next two weeks.
        </Text>
      ) : (
        unassignedFeedings.map((feeding) => {
          const dateStr = feeding.schedule_date.split('T')[0];
          const { dayName, dateLabel } = formatWeekDayHeader(dateStr);
          const isSelected = selectedFeedingIds.includes(feeding.id);

          return (
            <TouchableOpacity
              key={feeding.id}
              style={[styles.feedingRow, isSelected && styles.feedingRowSelected]}
              onPress={() => toggleFeedingSelection(feeding.id)}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.feedingRowText}>
                <Text style={styles.feedingRowTitle}>
                  {formatShiftLabel(feeding.shift_type)}
                </Text>
                <Text style={styles.feedingRowSubtitle}>
                  {dayName}, {dateLabel}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, category === 'feeding' && styles.sheetWithFixedFooter]}>
          <View style={styles.header}>
            <Text style={styles.title}>{getCategoryTitle()}</Text>
            <TouchableOpacity onPress={handleClose} accessibilityLabel="Close">
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          {category === 'feeding' ? (
            <>
              <ScrollView
                style={styles.feedingScroll}
                contentContainerStyle={styles.feedingScrollContent}
                showsVerticalScrollIndicator
              >
                {feedingContent}
              </ScrollView>
              <View style={styles.fixedFooter}>
                {error && <Text style={styles.errorText}>{error}</Text>}
                {actionButtons}
              </View>
            </>
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              {isGuest ? (
                <Text style={styles.guestMessage}>
                  Guests can view the stable. Request caregiver access to create or manage events.
                </Text>
              ) : (
                <>
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

              {category === 'task' && (
                <TaskFormFields values={taskValues} onChange={setTaskValues} users={users} />
              )}

              {category === 'ride' && (
              <>
                <DatePickerField label="Date" value={rideDate} onChange={setRideDate} />
                <TimePickerField
                  label="Start Time"
                  value={rideStart}
                  onChange={handleRideStartChange}
                  maximumTime={deriveMaxRideStartTime(rideDurationMinutes)}
                />
                <TimePickerField
                  label="End Time"
                  value={rideEnd}
                  onChange={handleRideEndChange}
                  minimumTime={minutesToTimeString(parseTimeToMinutes(rideStart) + 1)}
                  maximumTime={END_OF_DAY_TIME}
                />
                <PickerRow
                  label="Primary Rider"
                  options={userOptions}
                  selectedId={primaryRiderId}
                  onSelect={(id) => setPrimaryRiderId(id ?? '')}
                />
                {rideConflict && <RideSchedulingConflictBanner conflicts={rideConflict} />}
                <View style={styles.field}>
                  <Text style={styles.label}>Horses</Text>
                  <View style={styles.rowWrap}>
                    {horseOptions.map((horse) => {
                      const isConflicted = conflictHorseNames.has(horse.label);
                      return (
                        <TouchableOpacity
                          key={horse.id}
                          style={[
                            styles.chip,
                            selectedHorseIds.includes(horse.id) && styles.chipSelected,
                            isConflicted && styles.chipConflict,
                          ]}
                          onPress={() => toggleHorse(horse.id)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selectedHorseIds.includes(horse.id) && styles.chipTextSelected,
                              isConflicted && styles.chipTextConflict,
                            ]}
                          >
                            {horse.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
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
                <Text style={styles.label}>Comments (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={rideComments}
                  onChangeText={setRideComments}
                  multiline
                />
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

            {error && !rideConflict && <Text style={styles.errorText}>{error}</Text>}

            {actionButtons && <View style={styles.scrollActions}>{actionButtons}</View>}
                </>
              )}
          </ScrollView>
          )}
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
  sheetWithFixedFooter: {
    height: '92%',
  },
  feedingScroll: {
    flex: 1,
  },
  feedingScrollContent: {
    padding: 20,
    paddingBottom: 8,
  },
  fixedFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E0E6ED',
    backgroundColor: '#F5F7FA',
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
  chipConflict: {
    backgroundColor: '#FDEDEC',
    borderColor: '#E74C3C',
  },
  chipTextConflict: {
    color: '#922B21',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 0,
  },
  scrollActions: {
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
  guestMessage: {
    fontSize: 15,
    color: '#7F8C8D',
    lineHeight: 22,
  },
  emptyMessage: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingVertical: 24,
  },
  feedingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E6ED',
    gap: 12,
  },
  feedingRowSelected: {
    borderColor: '#3498DB',
    backgroundColor: '#EBF5FB',
  },
  feedingRowText: {
    flex: 1,
  },
  feedingRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  feedingRowSubtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#BDC3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
});
