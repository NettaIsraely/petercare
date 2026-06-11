import React from 'react';
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
import { useHorseDirectory } from '../hooks/useHorseDirectory';
import HorseListItem from '../components/horses/HorseListItem';
import { HorsesStackParamList } from '../navigation/types';
import { Horse } from '../types/horse';

type HorsesListNavigationProp = NativeStackNavigationProp<
  HorsesStackParamList,
  'HorsesList'
>;

export default function HorsesScreen() {
  const navigation = useNavigation<HorsesListNavigationProp>();
  const { horses, loading, refreshing, refresh } = useHorseDirectory();

  const handlePress = (horse: Horse) => {
    navigation.navigate('HorseDetail', {
      horseId: horse.id,
      horseName: horse.name,
      lastShoeingDate: horse.last_shoeing_date,
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
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
