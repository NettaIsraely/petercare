import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WelcomeHeaderProps {
  name: string;
  feedings: number;
  rides: number;
  tasks: number;
}

export default function WelcomeHeader({ name, feedings, rides, tasks }: WelcomeHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hello, {name}</Text>
      <Text style={styles.subtitle}>Here is your day at a glance</Text>
      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <Text style={styles.pillCount}>{feedings}</Text>
          <Text style={styles.pillLabel}>Feedings</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillCount}>{rides}</Text>
          <Text style={styles.pillLabel}>Rides</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillCount}>{tasks}</Text>
          <Text style={styles.pillLabel}>Tasks</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  pillCount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3498DB',
    marginBottom: 2,
  },
  pillLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
});
