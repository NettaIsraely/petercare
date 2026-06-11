import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Horse } from '../../types/horse';
import { getHorseIcon } from '../../utils/horseIcons';

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
      <Image source={getHorseIcon(horse.color)} style={styles.icon} />
      <View style={styles.content}>
        <Text style={styles.name}>{horse.name}</Text>
        <Text style={styles.subtitle}>Tap to view activity</Text>
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
  icon: {
    width: 40,
    height: 40,
    marginRight: 12,
    resizeMode: 'contain',
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
