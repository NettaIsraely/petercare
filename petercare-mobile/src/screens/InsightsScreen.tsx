import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useInsightsData } from '../hooks/useInsightsData';
import HorseActivityChart from '../components/insights/HorseActivityChart';
import PersonalStatsChecklist from '../components/insights/PersonalStatsChecklist';

export default function InsightsScreen() {
  const {
    weekRange,
    horseRideCounts,
    personalChecklist,
    loading,
    refreshing,
    refresh,
  } = useInsightsData();

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
      <HorseActivityChart weekRange={weekRange} horseRideCounts={horseRideCounts} />
      <PersonalStatsChecklist checklist={personalChecklist} />
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
