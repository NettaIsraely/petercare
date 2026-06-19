import React, { useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useMyDayData } from '../hooks/useMyDayData';
import { TimelineEvent } from '../types/events';
import { Task } from '../types/task';
import { Feeding } from '../types/feeding';
import { Ride } from '../types/ride';
import { Treatment } from '../types/treatment';
import WelcomeHeader from '../components/home/WelcomeHeader';
import AlertBanner from '../components/home/AlertBanner';
import ItineraryTimeline from '../components/home/ItineraryTimeline';
import OpenTasksList from '../components/home/OpenTasksList';
import EventDetailModal from '../components/schedule/EventDetailModal';
import TaskFormModal from '../components/tasks/TaskFormModal';
import FeedingEditModal from '../components/schedule/FeedingEditModal';
import EditEventModal from '../components/schedule/EditEventModal';

export default function HomeScreen() {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editFeeding, setEditFeeding] = useState<Feeding | null>(null);
  const [editRide, setEditRide] = useState<Ride | null>(null);
  const [editTreatment, setEditTreatment] = useState<Treatment | null>(null);

  const {
    myWeek,
    horses,
    assignableUsers,
    loading,
    refreshing,
    updating,
    alertTimes,
    volunteeringId,
    completingIds,
    refresh,
    volunteerForFeeding,
    toggleEventComplete,
    updateFeeding,
    updateTask,
    updateRide,
    updateTreatment,
  } = useMyDayData();

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

  const handleMarkComplete = async (event: TimelineEvent) => {
    await toggleEventComplete(event);
    handleCloseDetail();
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
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refresh(true)}
            tintColor="#3498DB"
          />
        }
      >
        <WelcomeHeader
          name={user?.name ?? 'there'}
          feedings={myWeek.summaryCounts.feedings}
          rides={myWeek.summaryCounts.rides}
          tasks={myWeek.summaryCounts.tasks}
        />

        <AlertBanner
          unassignedFeedings={myWeek.unassignedFeedings}
          overdueFeedings={myWeek.overdueFeedings}
          onVolunteer={volunteerForFeeding}
          volunteeringId={volunteeringId}
          userRole={user?.role}
          currentUserId={user?.userId}
        />

        <ItineraryTimeline
          daySections={myWeek.daySections}
          onToggleComplete={toggleEventComplete}
          onEventPress={handleEventPress}
          completingIds={completingIds}
          userRole={user?.role}
          currentUserId={user?.userId}
          alertTimes={alertTimes}
        />

        <OpenTasksList
          tasks={myWeek.openTasks}
          onMarkComplete={(task) =>
            toggleEventComplete({ kind: 'task', data: task, sortMinutes: 0 })
          }
          completingIds={completingIds}
          userRole={user?.role}
          currentUserId={user?.userId}
        />
      </ScrollView>

      <EventDetailModal
        visible={detailVisible}
        event={selectedEvent}
        currentUserId={user?.userId}
        userRole={user?.role}
        alertTimes={alertTimes}
        volunteeringId={volunteeringId}
        completingIds={completingIds}
        onClose={handleCloseDetail}
        onVolunteer={handleVolunteer}
        onClaim={async () => {}}
        onMarkComplete={handleMarkComplete}
        onEdit={handleEdit}
      />

      <TaskFormModal
        visible={!!editTask}
        mode="edit"
        initialTask={editTask ?? undefined}
        users={assignableUsers}
        submitting={updating}
        onClose={() => setEditTask(null)}
        onSubmitCreate={async () => {}}
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
        horses={horses}
        users={assignableUsers}
        submitting={updating}
        onClose={() => {
          setEditRide(null);
          setEditTreatment(null);
        }}
        onSubmitRide={updateRide}
        onSubmitTreatment={updateTreatment}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});
