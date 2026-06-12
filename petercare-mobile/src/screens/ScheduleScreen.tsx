import React, { useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useScheduleData } from '../hooks/useScheduleData';
import { useAuth } from '../context/AuthContext';
import { CalendarViewMode, ScheduleViewMode, TimelineEvent } from '../types/events';
import { Task } from '../types/task';
import { Feeding } from '../types/feeding';
import { Ride } from '../types/ride';
import { Treatment } from '../types/treatment';
import ViewToggleBar from '../components/schedule/ViewToggleBar';
import ScheduleCalendarView from '../components/schedule/ScheduleCalendarView';
import ScheduleListView from '../components/schedule/ScheduleListView';
import EventDetailModal from '../components/schedule/EventDetailModal';
import CreateEventFab from '../components/schedule/CreateEventFab';
import CreateEventModal from '../components/schedule/CreateEventModal';
import TaskFormModal from '../components/tasks/TaskFormModal';
import FeedingEditModal from '../components/schedule/FeedingEditModal';
import EditEventModal from '../components/schedule/EditEventModal';
import { canCreateEvents } from '../utils/eventPermissions';
import { confirmFeedingTakeOver } from '../utils/feedingTakeOverHelpers';

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('calendar');
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('weekly');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editFeeding, setEditFeeding] = useState<Feeding | null>(null);
  const [editRide, setEditRide] = useState<Ride | null>(null);
  const [editTreatment, setEditTreatment] = useState<Treatment | null>(null);

  const {
    raw,
    assignableUsers,
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
    takingOverId,
    claimingId,
    completingIds,
    creating,
    volunteeringBatch,
    updating,
    refresh,
    volunteerForFeeding,
    takeOverFeeding,
    volunteerForFeedings,
    claimTask,
    markEventComplete,
    availableUnassignedFeedings,
    createTask,
    updateTask,
    createRide,
    createTreatment,
    updateFeeding,
    updateRide,
    updateTreatment,
    currentUserId,
    userRole,
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

  const handleTakeOver = async (feedingId: string) => {
    if (selectedEvent?.kind !== 'feeding') {
      return;
    }

    const confirmed = await confirmFeedingTakeOver(selectedEvent.data);
    if (!confirmed) {
      return;
    }

    try {
      await takeOverFeeding(feedingId);
      handleCloseDetail();
    } catch {
      // Error already logged in hook
    }
  };

  const handleEdit = (event: TimelineEvent) => {
    handleCloseDetail();
    switch (event.kind) {
      case 'task':
        setEditTask(event.data);
        break;
      case 'feeding':
        setEditFeeding(event.data);
        break;
      case 'ride':
        setEditRide(event.data);
        break;
      case 'treatment':
        setEditTreatment(event.data);
        break;
    }
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
            users={raw.users}
            alertTimes={alertTimes}
          />
        )}
      </ScrollView>

      {canCreateEvents(user?.role) && (
        <CreateEventFab onPress={() => setCreateVisible(true)} />
      )}

      <EventDetailModal
        visible={detailVisible}
        event={selectedEvent}
        currentUserId={currentUserId}
        userRole={userRole}
        alertTimes={alertTimes}
        volunteeringId={volunteeringId}
        takingOverId={takingOverId}
        claimingId={claimingId}
        completingIds={completingIds}
        onClose={handleCloseDetail}
        onVolunteer={handleVolunteer}
        onTakeOver={handleTakeOver}
        onClaim={handleClaim}
        onMarkComplete={handleMarkComplete}
        onEdit={handleEdit}
      />

      <CreateEventModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        defaultDate={selectedDate}
        horses={raw.horses}
        users={assignableUsers}
        currentUserId={currentUserId}
        userRole={user?.role}
        creating={creating}
        volunteering={volunteeringBatch}
        unassignedFeedings={availableUnassignedFeedings}
        onVolunteerForFeedings={volunteerForFeedings}
        onCreateTask={createTask}
        onCreateRide={createRide}
        onCreateTreatment={createTreatment}
      />

      <TaskFormModal
        visible={!!editTask}
        mode="edit"
        initialTask={editTask ?? undefined}
        users={assignableUsers}
        submitting={updating}
        onClose={() => setEditTask(null)}
        onSubmitCreate={createTask}
        onSubmitEdit={updateTask}
      />

      <FeedingEditModal
        visible={!!editFeeding}
        feeding={editFeeding}
        users={assignableUsers}
        submitting={updating}
        onClose={() => setEditFeeding(null)}
        onSubmit={updateFeeding}
      />

      <EditEventModal
        visible={!!editRide || !!editTreatment}
        kind={editRide ? 'ride' : editTreatment ? 'treatment' : null}
        ride={editRide}
        treatment={editTreatment}
        horses={raw.horses}
        users={assignableUsers}
        submitting={updating}
        onClose={() => {
          setEditRide(null);
          setEditTreatment(null);
        }}
        onSubmitRide={updateRide}
        onSubmitTreatment={updateTreatment}
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
