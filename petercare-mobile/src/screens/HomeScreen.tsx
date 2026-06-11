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
    myDay,
    loading,
    refreshing,
    alertTimes,
    volunteeringId,
    completingIds,
    refresh,
    volunteerForFeeding,
    markFeedingComplete,
    markTaskComplete,
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
        feedings={myDay.summaryCounts.feedings}
        rides={myDay.summaryCounts.rides}
        tasks={myDay.summaryCounts.tasks}
      />

      <AlertBanner
        unassignedFeedings={myDay.unassignedFeedings}
        overdueFeedings={myDay.overdueFeedings}
        onVolunteer={volunteerForFeeding}
        volunteeringId={volunteeringId}
      />

      <ItineraryTimeline
        events={myDay.itinerary}
        onMarkFeedingComplete={markFeedingComplete}
        onMarkTaskComplete={markTaskComplete}
        completingIds={completingIds}
        alertTimes={alertTimes}
      />

      <OpenTasksList
        tasks={myDay.openTasks}
        onMarkTaskComplete={markTaskComplete}
        completingIds={completingIds}
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
