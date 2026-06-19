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
import { Feeding } from '../../types/feeding';
import { UserSummary } from '../../types/user';
import { FeedingStatus, UpdateFeedingPayload } from '../../types/feeding';
import TimePickerField from '../common/TimePickerField';
import { formatShiftLabel, formatTimeForApi, formatTimeForInput } from '../../utils/dateHelpers';

interface FeedingEditModalProps {
  visible: boolean;
  feeding: Feeding | null;
  users: UserSummary[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (id: string, payload: UpdateFeedingPayload) => Promise<void>;
}

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
            <Text style={[styles.chipText, selectedId === option.id && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function getDefaultAlertTime(feeding: Feeding, users: UserSummary[]): string {
  const assigneeId = feeding.assigned_user?.id;
  const assignee = assigneeId ? users.find((u) => u.id === assigneeId) : undefined;
  const alertTime =
    feeding.shift_type === 'MORNING'
      ? assignee?.morning_alert_time
      : assignee?.evening_alert_time;
  return formatTimeForInput(alertTime) || '08:00';
}

export default function FeedingEditModal({
  visible,
  feeding,
  users,
  submitting,
  onClose,
  onSubmit,
}: FeedingEditModalProps) {
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [alertTime, setAlertTime] = useState('08:00');
  const [feedingStatus, setFeedingStatus] = useState<FeedingStatus>('ASSIGNED');
  const [error, setError] = useState<string | null>(null);

  const userOptions = useMemo(
    () => users.map((u) => ({ id: u.id, label: u.name })),
    [users]
  );

  useEffect(() => {
    if (!visible || !feeding) {
      return;
    }
    setAssigneeId(feeding.assigned_user?.id);
    setAlertTime(getDefaultAlertTime(feeding, users));
    setFeedingStatus(feeding.feeding_status);
    setError(null);
  }, [visible, feeding, users]);

  if (!feeding) {
    return null;
  }

  const handleSubmit = async () => {
    setError(null);
    try {
      const payload: UpdateFeedingPayload = {
        assigned_user_id: assigneeId ?? null,
      };
      if (assigneeId) {
        payload.feeding_status = feedingStatus;
      }

      const formattedTime = formatTimeForApi(alertTime);
      if (formattedTime && assigneeId) {
        payload.notification_time = formattedTime;
      }

      await onSubmit(feeding.id, payload);
      onClose();
    } catch {
      setError('Failed to update feeding. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Feeding</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.subtitle}>{formatShiftLabel(feeding.shift_type)}</Text>

            <PickerRow
              label="Assigned to"
              options={userOptions}
              selectedId={assigneeId}
              onSelect={setAssigneeId}
              allowEmpty
            />

            {assigneeId ? (
              <TimePickerField
                label="Notification reminder time"
                value={alertTime}
                onChange={setAlertTime}
                optional
              />
            ) : null}

            {assigneeId ? (
              <View style={styles.field}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusRow}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      feedingStatus !== 'COMPLETE' && styles.chipSelected,
                    ]}
                    onPress={() => setFeedingStatus('ASSIGNED')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        feedingStatus !== 'COMPLETE' && styles.chipTextSelected,
                      ]}
                    >
                      Assigned
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      feedingStatus === 'COMPLETE' && styles.chipSelected,
                    ]}
                    onPress={() => setFeedingStatus('COMPLETE')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        feedingStatus === 'COMPLETE' && styles.chipTextSelected,
                      ]}
                    >
                      Complete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {error && <Text style={styles.errorText}>{error}</Text>}

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
  subtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 6,
  },
  chipRow: {
    flexGrow: 0,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
