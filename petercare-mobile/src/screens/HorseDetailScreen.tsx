import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHorseDetail } from '../hooks/useHorseDetail';
import HorseHistoryLog from '../components/horses/HorseHistoryLog';
import { HorsesStackParamList } from '../navigation/types';
import { formatShoeingDate } from '../utils/horseHelpers';

type Props = NativeStackScreenProps<HorsesStackParamList, 'HorseDetail'>;

export default function HorseDetailScreen({ route }: Props) {
  const { horseId, horseName, lastShoeingDate } = route.params;
  const { history, loading, refreshing, refresh } = useHorseDetail(horseId);

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
      <View style={styles.profileCard}>
        <Text style={styles.horseName}>{horseName}</Text>
        <Text style={styles.profileLabel}>Last Shoeing</Text>
        <Text style={styles.profileValue}>{formatShoeingDate(lastShoeingDate)}</Text>
      </View>

      <HorseHistoryLog history={history} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  horseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    color: '#2C3E50',
  },
});
