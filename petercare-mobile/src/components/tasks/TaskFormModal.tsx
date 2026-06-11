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
import { X } from 'lucide-react-native';
import { CreateTaskPayload, Task, UpdateTaskPayload } from '../../types/task';
import { UserSummary } from '../../types/user';
import DatePickerField from '../schedule/DatePickerField';
import { normalizeDateString } from '../../utils/dateHelpers';

export interface TaskFormValues {
  name: string;
  deadline: string;
  comments: string;
  assigneeId?: string;
  isComplete?: boolean;
}

interface TaskFormFieldsProps {
  values: TaskFormValues;
  onChange: (values: TaskFormValues) => void;
  users: UserSummary[];
  showCompleteToggle?: boolean;
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

export function TaskFormFields({
  values,
  onChange,
  users,
  showCompleteToggle = false,
}: TaskFormFieldsProps) {
  const userOptions = users.map((u) => ({ id: u.id, label: u.name }));

  return (
    <>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={values.name}
        onChangeText={(name: string) => onChange({ ...values, name })}
      />
      <DatePickerField
        label="Deadline (optional)"
        value={values.deadline}
        onChange={(deadline) => onChange({ ...values, deadline })}
        optional
      />
      <Text style={styles.label}>Comments (optional)</Text>
      <TextInput
        style={styles.input}
        value={values.comments}
        onChangeText={(comments: string) => onChange({ ...values, comments })}
        multiline
      />
      <PickerRow
        label="Assign to (optional)"
        options={userOptions}
        selectedId={values.assigneeId}
        onSelect={(assigneeId) => onChange({ ...values, assigneeId })}
        allowEmpty
      />
      {showCompleteToggle && (
        <View style={styles.field}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.chip, !values.isComplete && styles.chipSelected]}
              onPress={() => onChange({ ...values, isComplete: false })}
            >
              <Text style={[styles.chipText, !values.isComplete && styles.chipTextSelected]}>
                Open
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, values.isComplete && styles.chipSelected]}
              onPress={() => onChange({ ...values, isComplete: true })}
            >
              <Text style={[styles.chipText, values.isComplete && styles.chipTextSelected]}>
                Complete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

export function taskToFormValues(task?: Task): TaskFormValues {
  if (!task) {
    return {
      name: '',
      deadline: '',
      comments: '',
      assigneeId: undefined,
      isComplete: false,
    };
  }

  return {
    name: task.name,
    deadline: task.deadline ? normalizeDateString(task.deadline) : '',
    comments: task.comments ?? '',
    assigneeId: task.assigned_user?.id,
    isComplete: task.is_complete ?? false,
  };
}

export function formValuesToCreatePayload(values: TaskFormValues): CreateTaskPayload {
  return {
    name: values.name.trim(),
    deadline: values.deadline.trim() || undefined,
    comments: values.comments.trim() || undefined,
    assigned_user_id: values.assigneeId,
  };
}

export function formValuesToUpdatePayload(
  values: TaskFormValues,
  initialTask: Task
): UpdateTaskPayload {
  const payload: UpdateTaskPayload = {
    name: values.name.trim(),
    deadline: values.deadline.trim() || undefined,
    comments: values.comments.trim() || undefined,
    is_complete: values.isComplete,
  };

  const initialAssigneeId = initialTask.assigned_user?.id;
  if (values.assigneeId !== initialAssigneeId) {
    payload.assigned_user_id = values.assigneeId ?? null;
  }

  return payload;
}

interface TaskFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initialTask?: Task;
  users: UserSummary[];
  submitting: boolean;
  onClose: () => void;
  onSubmitCreate: (payload: CreateTaskPayload) => Promise<void>;
  onSubmitEdit?: (id: string, payload: UpdateTaskPayload) => Promise<void>;
}

export default function TaskFormModal({
  visible,
  mode,
  initialTask,
  users,
  submitting,
  onClose,
  onSubmitCreate,
  onSubmitEdit,
}: TaskFormModalProps) {
  const [values, setValues] = useState<TaskFormValues>(taskToFormValues());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValues(taskToFormValues(mode === 'edit' ? initialTask : undefined));
      setError(null);
    }
  }, [visible, mode, initialTask]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    if (!values.name.trim()) {
      setError('Task name is required.');
      return;
    }

    try {
      if (mode === 'create') {
        await onSubmitCreate(formValuesToCreatePayload(values));
      } else if (initialTask && onSubmitEdit) {
        await onSubmitEdit(initialTask.id, formValuesToUpdatePayload(values, initialTask));
      }
      handleClose();
    } catch {
      setError('Failed to save task. Please check your inputs and try again.');
    }
  };

  const title = mode === 'create' ? 'New Task' : 'Edit Task';
  const submitLabel = mode === 'create' ? 'Create' : 'Save';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} accessibilityLabel="Close">
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <TaskFormFields
              values={values}
              onChange={setValues}
              users={users}
              showCompleteToggle={mode === 'edit'}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>{submitLabel}</Text>
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
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
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
