import React, { useEffect, useMemo, useState } from 'react';
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
import { X } from 'lucide-react-native';
import { Ride, UpdateRidePayload } from '../../types/ride';
import {
  PREDEFINED_TREATMENT_NAMES,
  PredefinedTreatmentName,
  Treatment,
  UpdateTreatmentPayload,
} from '../../types/treatment';
import { Horse } from '../../types/horse';
import { UserSummary } from '../../types/user';
import DatePickerField from './DatePickerField';
import TimePickerField from '../common/TimePickerField';
import {
  formatTimeForApi,
  formatTimeForInput,
  normalizeDateString,
  parseTimeToMinutes,
} from '../../utils/dateHelpers';
import RideSchedulingConflictBanner from './RideSchedulingConflictBanner';
import {
  getApiErrorMessage,
  getConflictHorseNames,
  parseRideSchedulingConflict,
  RideConflictDetails,
} from '../../utils/rideConflictHelpers';

type EditEventKind = 'ride' | 'treatment';

interface EditEventModalProps {
  visible: boolean;
  kind: EditEventKind | null;
  ride?: Ride | null;
  treatment?: Treatment | null;
  horses: Horse[];
  users: UserSummary[];
  submitting: boolean;
  onClose: () => void;
  onSubmitRide: (id: string, payload: UpdateRidePayload) => Promise<void>;
  onSubmitTreatment: (id: string, payload: UpdateTreatmentPayload) => Promise<void>;
}

function PickerRow({
  label,
  options,
  selectedId,
  onSelect,
}: {
  label: string;
  options: { id: string; label: string }[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.chip, selectedId === option.id && styles.chipSelected]}
            onPress={() => onSelect(option.id)}
          >
            <Text style={[styles.chipText, selectedId === option.id && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function EditEventModal({
  visible,
  kind,
  ride,
  treatment,
  horses,
  users,
  submitting,
  onClose,
  onSubmitRide,
  onSubmitTreatment,
}: EditEventModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [rideConflict, setRideConflict] = useState<RideConflictDetails | null>(null);

  const userOptions = useMemo(() => users.map((u) => ({ id: u.id, label: u.name })), [users]);
  const horseOptions = useMemo(
    () => horses.filter((h) => h.is_active).map((h) => ({ id: h.id, label: h.name })),
    [horses]
  );

  const [rideDate, setRideDate] = useState('');
  const [rideStart, setRideStart] = useState('09:00');
  const [rideEnd, setRideEnd] = useState('10:00');
  const [primaryRiderId, setPrimaryRiderId] = useState('');
  const [selectedHorseIds, setSelectedHorseIds] = useState<string[]>([]);
  const [additionalRiderIds, setAdditionalRiderIds] = useState<string[]>([]);
  const [rideComments, setRideComments] = useState('');

  const [treatmentNamePreset, setTreatmentNamePreset] = useState<PredefinedTreatmentName | null>(
    null
  );
  const [treatmentCustomName, setTreatmentCustomName] = useState('');
  const [treatmentDate, setTreatmentDate] = useState('');
  const [treatmentDuration, setTreatmentDuration] = useState('');
  const [treatmentHorseIds, setTreatmentHorseIds] = useState<string[]>([]);
  const [treatmentUserId, setTreatmentUserId] = useState('');

  useEffect(() => {
    if (!visible || !kind) {
      return;
    }

    setError(null);
    setRideConflict(null);

    if (kind === 'ride' && ride) {
      setRideDate(normalizeDateString(ride.date));
      setRideStart(formatTimeForInput(ride.start_time) || '09:00');
      setRideEnd(formatTimeForInput(ride.end_time) || '10:00');
      setPrimaryRiderId(ride.primary_rider.id);
      setSelectedHorseIds(ride.horses.map((h) => h.id));
      setAdditionalRiderIds(ride.additional_riders?.map((r) => r.id) ?? []);
      setRideComments(ride.comments ?? '');
    }

    if (kind === 'treatment' && treatment) {
      const isPreset = PREDEFINED_TREATMENT_NAMES.includes(
        treatment.name as PredefinedTreatmentName
      );
      setTreatmentNamePreset(isPreset ? (treatment.name as PredefinedTreatmentName) : null);
      setTreatmentCustomName(isPreset ? '' : treatment.name);
      setTreatmentDate(normalizeDateString(treatment.date));
      setTreatmentDuration(
        treatment.duration_minutes !== undefined ? String(treatment.duration_minutes) : ''
      );
      setTreatmentHorseIds(treatment.horses.map((h) => h.id));
      setTreatmentUserId(treatment.user.id);
    }
  }, [visible, kind, ride, treatment]);

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
    setRideConflict(null);
    try {
      if (kind === 'ride' && ride) {
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
        await onSubmitRide(ride.id, {
          date: rideDate.trim(),
          start_time: startTime,
          end_time: endTime,
          primary_rider_id: primaryRiderId,
          horses: selectedHorseIds,
          additional_riders_ids: additionalRiderIds,
          comments: rideComments.trim() || undefined,
        });
      } else if (kind === 'treatment' && treatment) {
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
        await onSubmitTreatment(treatment.id, {
          name: resolvedTreatmentName,
          date: treatmentDate.trim() || undefined,
          duration_minutes: treatmentDuration.trim()
            ? parseInt(treatmentDuration, 10)
            : undefined,
          horse_ids: treatmentHorseIds,
          user_id: treatmentUserId,
        });
      }
      onClose();
    } catch (err: unknown) {
      if (kind === 'ride') {
        const conflicts = parseRideSchedulingConflict(err);
        if (conflicts) {
          setRideConflict(conflicts);
          return;
        }
      }

      setError(
        getApiErrorMessage(
          err,
          kind === 'ride'
            ? 'One or more horses or riders are already scheduled for this time.'
            : 'Failed to update event. Please try again.'
        )
      );
    }
  };

  const title = kind === 'ride' ? 'Edit Ride' : kind === 'treatment' ? 'Edit Treatment' : 'Edit Event';
  const conflictHorseNames = rideConflict ? getConflictHorseNames(rideConflict) : new Set<string>();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {kind === 'ride' && (
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

            {kind === 'treatment' && (
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

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Save</Text>
              )}
            </TouchableOpacity>
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
  primaryButton: {
    backgroundColor: '#3498DB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 8,
  },
});
