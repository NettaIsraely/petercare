import React, { useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useScheduleData } from '../hooks/useScheduleData';
import { CalendarViewMode, ScheduleViewMode, TimelineEvent } from '../types/events';
import { Task } from '../types/task';
import ViewToggleBar from '../components/schedule/ViewToggleBar';
import ScheduleCalendarView from '../components/schedule/ScheduleCalendarView';
import ScheduleListView from '../components/schedule/ScheduleListView';
import EventDetailModal from '../components/schedule/EventDetailModal';
import CreateEventFab from '../components/schedule/CreateEventFab';
import CreateEventModal from '../components/schedule/CreateEventModal';
import TaskFormModal from '../components/tasks/TaskFormModal';

export default function ScheduleScreen() {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('calendar');
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('weekly');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const {
    raw,
    listSections,
    markedDates,
    selectedDate,
    setSelectedDate,
    selectedDateEvents,
    weekEvents,
    alertTimes,
    loading,
    refreshing,
    volunteeringId,
    claimingId,
    completingIds,
    creating,
    updating,
    refresh,
    volunteerForFeeding,
    claimTask,
    markEventComplete,
    createFeeding,
    createTask,
    updateTask,
    createRide,
    createTreatment,
    currentUserId,
  } = useScheduleData();

  const handleEventPress = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailVisible(false);
    setSelectedEvent(null);
  };

  const handleVolunteer = async (feedingId: string, notificationTime?: string) => {
    await volunteerForFeeding(feedingId, notificationTime);
    handleCloseDetail();
  };

  const handleClaim = async (taskId: string) => {
    await claimTask(taskId);
    handleCloseDetail();
  };

  const handleMarkComplete = async (event: TimelineEvent) => {
    await markEventComplete(event);
    handleCloseDetail();
  };

  const handleEditTask = (task: Task) => {
    handleCloseDetail();
    setEditTask(task);
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
            onRefresh={() => refresh(true)}
            tintColor="#3498DB"
          />
        }
      >
        <ViewToggleBar mode={viewMode} onChange={setViewMode} />

        {viewMode === 'calendar' ? (
          <ScheduleCalendarView
            calendarViewMode={calendarViewMode}
            onCalendarViewModeChange={setCalendarViewMode}
            markedDates={markedDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedDateEvents={selectedDateEvents}
            weekEvents={weekEvents}
            users={raw.users}
            onEventPress={handleEventPress}
            currentUserId={currentUserId}
            alertTimes={alertTimes}
          />
        ) : (
          <ScheduleListView
            sections={listSections}
            onEventPress={handleEventPress}
            currentUserId={currentUserId}
            alertTimes={alertTimes}
          />
        )}
      </ScrollView>

      <CreateEventFab onPress={() => setCreateVisible(true)} />

      <EventDetailModal
        visible={detailVisible}
        event={selectedEvent}
        currentUserId={currentUserId}
        alertTimes={alertTimes}
        volunteeringId={volunteeringId}
        claimingId={claimingId}
        completingIds={completingIds}
        onClose={handleCloseDetail}
        onVolunteer={handleVolunteer}
        onClaim={handleClaim}
        onMarkComplete={handleMarkComplete}
        onEditTask={handleEditTask}
      />

      <CreateEventModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        defaultDate={selectedDate}
        horses={raw.horses}
        users={raw.users}
        currentUserId={currentUserId}
        creating={creating}
        onCreateFeeding={createFeeding}
        onCreateTask={createTask}
        onCreateRide={createRide}
        onCreateTreatment={createTreatment}
      />

      <TaskFormModal
        visible={!!editTask}
        mode="edit"
        initialTask={editTask ?? undefined}
        users={raw.users}
        submitting={updating}
        onClose={() => setEditTask(null)}
        onSubmitCreate={createTask}
        onSubmitEdit={updateTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});
