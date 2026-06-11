import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useMyDayData } from '../hooks/useMyDayData';
import WelcomeHeader from '../components/home/WelcomeHeader';
import AlertBanner from '../components/home/AlertBanner';
import ItineraryTimeline from '../components/home/ItineraryTimeline';
import OpenTasksList from '../components/home/OpenTasksList';

export default function HomeScreen() {
  const { user } = useAuth();
  const {
    myWeek,
    loading,
    refreshing,
    alertTimes,
    volunteeringId,
    completingIds,
    refresh,
    volunteerForFeeding,
    markEventComplete,
  } = useMyDayData();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  return (
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
        onMarkComplete={markEventComplete}
        completingIds={completingIds}
        userRole={user?.role}
        currentUserId={user?.userId}
        alertTimes={alertTimes}
      />

      <OpenTasksList
        tasks={myWeek.openTasks}
        onMarkComplete={(task) =>
          markEventComplete({ kind: 'task', data: task, sortMinutes: 0 })
        }
        completingIds={completingIds}
        userRole={user?.role}
        currentUserId={user?.userId}
      />
    </ScrollView>
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
