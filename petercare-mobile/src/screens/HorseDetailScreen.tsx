import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHorseDetail } from '../hooks/useHorseDetail';
import HorseHistoryLog from '../components/horses/HorseHistoryLog';
import HorseFormModal from '../components/horses/HorseFormModal';
import { useAuth } from '../context/AuthContext';
import { HorsesStackParamList } from '../navigation/types';
import * as horseService from '../services/horseService';
import { UpdateHorsePayload } from '../types/horse';
import { formatShoeingDate } from '../utils/horseHelpers';
import { getHorseIcon } from '../utils/horseIcons';

type Props = NativeStackScreenProps<HorsesStackParamList, 'HorseDetail'>;

export default function HorseDetailScreen({ route, navigation }: Props) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const { rides, treatments, loading, refreshing, refresh } = useHorseDetail(horseId);

  const [horseName, setHorseName] = useState(route.params.horseName);
  const [horseColor, setHorseColor] = useState(route.params.horseColor);
  const [lastShoeingDate, setLastShoeingDate] = useState(route.params.lastShoeingDate);
  const [editVisible, setEditVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isOwner = user?.role === 'OWNER';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: horseName,
      headerRight: isOwner
        ? () => (
            <TouchableOpacity
              onPress={() => setEditVisible(true)}
              style={styles.headerButton}
              accessibilityLabel="Edit horse"
            >
              <Text style={styles.headerButtonText}>Edit</Text>
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [navigation, horseName, isOwner]);

  const handleUpdateHorse = useCallback(
    async (payload: UpdateHorsePayload) => {
      setUpdating(true);
      try {
        const updated = await horseService.updateHorse(horseId, payload);
        setHorseName(updated.name);
        setHorseColor(updated.color);
        setLastShoeingDate(updated.last_shoeing_date);
        navigation.setParams({
          horseName: updated.name,
          horseColor: updated.color,
          lastShoeingDate: updated.last_shoeing_date,
        });
      } finally {
        setUpdating(false);
      }
    },
    [horseId, navigation]
  );

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
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image source={getHorseIcon(horseColor)} style={styles.icon} />
            <Text style={styles.horseName}>{horseName}</Text>
          </View>
          <Text style={styles.profileLabel}>Last Shoeing</Text>
          <Text style={styles.profileValue}>{formatShoeingDate(lastShoeingDate)}</Text>
        </View>

        <HorseHistoryLog rides={rides} treatments={treatments} />
      </ScrollView>

      {isOwner ? (
        <HorseFormModal
          mode="edit"
          visible={editVisible}
          onClose={() => setEditVisible(false)}
          submitting={updating}
          initialValues={{
            name: horseName,
            color: horseColor,
            lastShoeingDate,
          }}
          onSubmit={handleUpdateHorse}
        />
      ) : null}
    </>
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
  headerButton: {
    marginRight: 16,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498DB',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  icon: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  horseName: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
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
