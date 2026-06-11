import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useHorseDirectory } from '../hooks/useHorseDirectory';
import HorseListItem from '../components/horses/HorseListItem';
import CreateEventFab from '../components/schedule/CreateEventFab';
import HorseFormModal from '../components/horses/HorseFormModal';
import { HorsesStackParamList } from '../navigation/types';
import { Horse } from '../types/horse';

type HorsesListNavigationProp = NativeStackNavigationProp<
  HorsesStackParamList,
  'HorsesList'
>;

export default function HorsesScreen() {
  const navigation = useNavigation<HorsesListNavigationProp>();
  const { user } = useAuth();
  const { horses, loading, refreshing, creating, refresh, createHorse } = useHorseDirectory();
  const [createVisible, setCreateVisible] = useState(false);

  const isOwner = user?.role === 'OWNER';

  const handlePress = (horse: Horse) => {
    navigation.navigate('HorseDetail', {
      horseId: horse.id,
      horseName: horse.name,
      horseColor: horse.color,
      lastShoeingDate: horse.last_shoeing_date,
    });
  };

  const handleCreateHorse = async (payload: Parameters<typeof createHorse>[0]) => {
    await createHorse(payload);
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
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={horses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HorseListItem horse={item} onPress={() => handlePress(item)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refresh(true)}
            tintColor="#3498DB"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active horses found.</Text>
          </View>
        }
      />

      {isOwner ? (
        <>
          <CreateEventFab onPress={() => setCreateVisible(true)} />
          <HorseFormModal
            mode="create"
            visible={createVisible}
            onClose={() => setCreateVisible(false)}
            submitting={creating}
            onSubmit={handleCreateHorse}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  list: {
    flex: 1,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});
