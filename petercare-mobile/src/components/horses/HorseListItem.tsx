import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Horse } from '../../types/horse';
import { formatShoeingDate } from '../../utils/horseHelpers';

interface HorseListItemProps {
  horse: Horse;
  onPress: () => void;
}

export default function HorseListItem({ horse, onPress }: HorseListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${horse.name}`}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{horse.name}</Text>
        <Text style={styles.subtitle}>
          Last shoeing: {formatShoeingDate(horse.last_shoeing_date)}
        </Text>
      </View>
      <ChevronRight size={20} color="#7F8C8D" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
});
