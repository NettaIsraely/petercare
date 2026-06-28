import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Ride, UpdateRidePayload, filterAdditionalRiderIds, getDisplayAdditionalRiders } from '../../types/ride';
import { Horse } from '../../types/horse';
import TimePickerField from '../common/TimePickerField';
import {
  formatTimeForApi,
  formatTimeForInput,
  formatTimeLabel,
  formatUserFacingDate,
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

interface JoinRideModalProps {
  visible: boolean;
  ride: Ride | null;
  horses: Horse[];
  currentUserId?: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (id: string, payload: UpdateRidePayload) => Promise<void>;
}

export default function JoinRideModal({
  visible,
  ride,
  horses,
  currentUserId,
  submitting,
  onClose,
  onSubmit,
}: JoinRideModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [rideConflict, setRideConflict] = useState<RideConflictDetails | null>(null);
  const [rideStart, setRideStart] = useState('09:00');
  const [rideEnd, setRideEnd] = useState('10:00');
  const [selectedHorseIds, setSelectedHorseIds] = useState<string[]>([]);

  const horseOptions = useMemo(
    () => horses.filter((h) => h.is_active).map((h) => ({ id: h.id, label: h.name })),
    [horses]
  );

  useEffect(() => {
    if (!visible || !ride) {
      return;
    }

    setError(null);
    setRideConflict(null);
    setRideStart(formatTimeForInput(ride.start_time) || '09:00');
    setRideEnd(formatTimeForInput(ride.end_time) || '10:00');
    setSelectedHorseIds(ride.horses.map((h) => h.id));
  }, [visible, ride]);

  const toggleHorse = (horseId: string) => {
    setSelectedHorseIds((prev) =>
      prev.includes(horseId) ? prev.filter((id) => id !== horseId) : [...prev, horseId]
    );
  };

  const handleSubmit = async () => {
    if (!ride || !currentUserId) {
      return;
    }

    setError(null);
    setRideConflict(null);

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

    const existingAdditionalIds = ride.additional_riders?.map((r) => r.id) ?? [];
    const additionalRiderIds = filterAdditionalRiderIds(ride.primary_rider.id, [
      ...(existingAdditionalIds.includes(currentUserId)
        ? existingAdditionalIds
        : [...existingAdditionalIds, currentUserId]),
    ]);

    try {
      await onSubmit(ride.id, {
        date: normalizeDateString(ride.date),
        start_time: startTime,
        end_time: endTime,
        primary_rider_id: ride.primary_rider.id,
        horses: selectedHorseIds,
        additional_riders_ids: additionalRiderIds,
        comments: ride.comments ?? undefined,
      });
      onClose();
    } catch (err: unknown) {
      const conflicts = parseRideSchedulingConflict(err);
      if (conflicts) {
        setRideConflict(conflicts);
        return;
      }

      setError(
        getApiErrorMessage(
          err,
          'One or more horses or riders are already scheduled for this time.'
        )
      );
    }
  };

  if (!ride) {
    return null;
  }

  const conflictHorseNames = rideConflict ? getConflictHorseNames(rideConflict) : new Set<string>();
  const additionalRiderNames = getDisplayAdditionalRiders(ride).map((r) => r.name).join(', ');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Join Ride</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLine}>
                Date: {formatUserFacingDate(normalizeDateString(ride.date))}
              </Text>
              <Text style={styles.summaryLine}>Primary rider: {ride.primary_rider.name}</Text>
              {additionalRiderNames ? (
                <Text style={styles.summaryLine}>Additional riders: {additionalRiderNames}</Text>
              ) : null}
              {ride.comments ? (
                <Text style={styles.summaryComments}>{ride.comments}</Text>
              ) : null}
            </View>

            <TimePickerField label="Start Time" value={rideStart} onChange={setRideStart} />
            <TimePickerField label="End Time" value={rideEnd} onChange={setRideEnd} />

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

            <Text style={styles.helper}>
              Current time: {formatTimeLabel(ride.start_time)} – {formatTimeLabel(ride.end_time)}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Join Ride</Text>
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
    maxHeight: '90%',
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  summaryLine: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 6,
  },
  summaryComments: {
    marginTop: 8,
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  chipSelected: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  chipConflict: {
    borderColor: '#E74C3C',
  },
  chipText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chipTextConflict: {
    color: '#C0392B',
  },
  helper: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  error: {
    color: '#C0392B',
    marginBottom: 12,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#3498DB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
