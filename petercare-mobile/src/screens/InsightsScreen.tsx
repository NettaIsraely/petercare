import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useInsightsData } from '../hooks/useInsightsData';
import { useAuth } from '../context/AuthContext';
import InsightsWeekPager from '../components/insights/InsightsWeekPager';

export default function InsightsScreen() {
  const { user } = useAuth();
  const {
    weekOffset,
    setWeekOffset,
    weekRange,
    cachedData,
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
    <View style={styles.container}>
      <InsightsWeekPager
        weekOffset={weekOffset}
        setWeekOffset={setWeekOffset}
        weekRange={weekRange}
        cachedData={cachedData}
        userId={user?.userId ?? ''}
        refreshing={refreshing}
        onRefresh={() => refresh(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});
