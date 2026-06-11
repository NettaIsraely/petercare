import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Horse } from '../../types/horse';
import HorseListItem from './HorseListItem';

interface HorsesSectionProps {
  horses: Horse[];
  showAddButton?: boolean;
  onAddPress?: () => void;
  onHorsePress: (horse: Horse) => void;
}

export default function HorsesSection({
  horses,
  showAddButton = false,
  onAddPress,
  onHorsePress,
}: HorsesSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Horses</Text>
        {showAddButton && onAddPress ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddPress}
            accessibilityLabel="Add horse"
          >
            <Plus size={18} color="#3498DB" />
            <Text style={styles.addButtonText}>Add horse</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {horses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active horses found.</Text>
        </View>
      ) : (
        horses.map((horse) => (
          <HorseListItem key={horse.id} horse={horse} onPress={() => onHorsePress(horse)} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E6ED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EBF5FB',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498DB',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});
