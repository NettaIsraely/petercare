import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UserSummary } from '../../types/user';
import { resolveUserColor } from '../../utils/userColors';

interface AdditionalRiderDotsProps {
  riders: Pick<UserSummary, 'id' | 'profile_color' | 'name'>[];
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export default function AdditionalRiderDots({ riders }: AdditionalRiderDotsProps) {
  if (riders.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {riders.map((rider) => (
        <View
          key={rider.id}
          style={[styles.dot, { backgroundColor: resolveUserColor(rider) }]}
          accessibilityLabel={getFirstName(rider.name)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#D5DBDB',
  },
});
