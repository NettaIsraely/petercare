import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useHorseDirectory } from '../hooks/useHorseDirectory';
import { useTasksData } from '../hooks/useTasksData';
import { HorsesStackParamList } from '../navigation/types';
import { Horse } from '../types/horse';
import { Task } from '../types/task';
import { TimelineEvent } from '../types/events';
import { AssigneeFilter, buildFilteredBarnTasks } from '../utils/taskHelpers';
import TaskAssigneeFilter from '../components/tasks/TaskAssigneeFilter';
import BarnTaskSections from '../components/tasks/BarnTaskSections';
import HorsesSection from '../components/horses/HorsesSection';
import CreateEventFab from '../components/schedule/CreateEventFab';
import HorseFormModal from '../components/horses/HorseFormModal';
import TaskFormModal from '../components/tasks/TaskFormModal';
import EventDetailModal from '../components/schedule/EventDetailModal';
import { canCreateEvents } from '../utils/eventPermissions';

type HorsesListNavigationProp = NativeStackNavigationProp<
  HorsesStackParamList,
  'HorsesList'
>;

export default function HorsesScreen() {
  const navigation = useNavigation<HorsesListNavigationProp>();
  const { user } = useAuth();
  const {
    horses,
    loading: horsesLoading,
    refreshing: horsesRefreshing,
    creating: horseCreating,
    refresh: refreshHorses,
    createHorse,
  } = useHorseDirectory();
  const {
    tasks,
    users,
    loading: tasksLoading,
    refreshing: tasksRefreshing,
    creating: taskCreating,
    updating: taskUpdating,
    claimingId,
    completingIds,
    refresh: refreshTasks,
    createTask,
    updateTask,
    claimTask,
    markTaskComplete,
    markEventComplete,
    currentUserId,
  } = useTasksData();

  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createTaskVisible, setCreateTaskVisible] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [createHorseVisible, setCreateHorseVisible] = useState(false);

  const isOwner = user?.role === 'OWNER';
  const loading = horsesLoading || tasksLoading;
  const refreshing = horsesRefreshing || tasksRefreshing;

  const { openTasks, completedTasks } = useMemo(
    () => buildFilteredBarnTasks(tasks, assigneeFilter, currentUserId),
    [tasks, assigneeFilter, currentUserId]
  );

  const handleRefresh = () => {
    refreshTasks(true);
    refreshHorses(true);
  };

  const handleHorsePress = (horse: Horse) => {
    navigation.navigate('HorseDetail', {
      horseId: horse.id,
      horseName: horse.name,
      horseColor: horse.color,
      lastShoeingDate: horse.last_shoeing_date,
    });
  };

  const handleCreateHorse = async (payload: Parameters<typeof createHorse>[0]) => {
    await createHorse(payload);
    setCreateHorseVisible(false);
  };

  const handleTaskPress = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailVisible(false);
    setSelectedEvent(null);
  };

  const handleEdit = (event: TimelineEvent) => {
    if (event.kind === 'task') {
      handleCloseDetail();
      setEditTask(event.data);
    }
  };

  const handleClaim = async (taskId: string) => {
    await claimTask(taskId);
    handleCloseDetail();
  };

  const handleMarkComplete = async (event: TimelineEvent) => {
    await markEventComplete(event);
    handleCloseDetail();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3498DB"
          />
        }
      >
        <TaskAssigneeFilter
          filter={assigneeFilter}
          onChange={setAssigneeFilter}
          users={users}
        />

        <BarnTaskSections
          openTasks={openTasks}
          completedTasks={completedTasks}
          currentUserId={currentUserId}
          userRole={user?.role}
          completingIds={completingIds}
          onTaskPress={handleTaskPress}
          onMarkComplete={markTaskComplete}
        />

        <HorsesSection
          horses={horses}
          showAddButton={isOwner}
          onAddPress={() => setCreateHorseVisible(true)}
          onHorsePress={handleHorsePress}
        />
      </ScrollView>

      {canCreateEvents(user?.role) && (
        <CreateEventFab onPress={() => setCreateTaskVisible(true)} />
      )}

      <EventDetailModal
        visible={detailVisible}
        event={selectedEvent}
        currentUserId={currentUserId}
        userRole={user?.role}
        claimingId={claimingId}
        completingIds={completingIds}
        onClose={handleCloseDetail}
        onVolunteer={() => {}}
        onClaim={handleClaim}
        onMarkComplete={handleMarkComplete}
        onEdit={handleEdit}
      />

      <TaskFormModal
        visible={createTaskVisible}
        mode="create"
        users={users}
        submitting={taskCreating}
        onClose={() => setCreateTaskVisible(false)}
        onSubmitCreate={createTask}
      />

      <TaskFormModal
        visible={!!editTask}
        mode="edit"
        initialTask={editTask ?? undefined}
        users={users}
        submitting={taskUpdating}
        onClose={() => setEditTask(null)}
        onSubmitCreate={createTask}
        onSubmitEdit={updateTask}
      />

      {isOwner ? (
        <HorseFormModal
          mode="create"
          visible={createHorseVisible}
          onClose={() => setCreateHorseVisible(false)}
          submitting={horseCreating}
          onSubmit={handleCreateHorse}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});
