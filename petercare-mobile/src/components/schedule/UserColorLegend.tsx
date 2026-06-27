import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserSummary } from '../../types/user';
import { resolveUserColor, UNASSIGNED_FEEDING_COLOR } from '../../utils/userColors';

interface UserColorLegendProps {
  users: UserSummary[];
  currentUserId?: string;
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export default function UserColorLegend({ users, currentUserId }: UserColorLegendProps) {
  const legendUsers = users.filter((user) => user.role !== 'GUEST');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Color key</Text>
      <View style={styles.chips}>
        <View style={styles.chip}>
          <View
            style={[styles.swatch, { backgroundColor: UNASSIGNED_FEEDING_COLOR }]}
          />
          <Text style={styles.chipLabel}>Unassigned</Text>
        </View>
        {legendUsers.map((user) => (
          <View key={user.id} style={styles.chip}>
            <View
              style={[styles.swatch, { backgroundColor: resolveUserColor(user) }]}
            />
            <Text style={styles.chipLabel}>
              {getFirstName(user.name)}
              {user.id === currentUserId ? ' (you)' : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D5DBDB',
  },
  chipLabel: {
    fontSize: 12,
    color: '#5D6D7E',
  },
});
