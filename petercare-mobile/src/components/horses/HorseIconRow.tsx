import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { HorseColor } from '../../types/horse';
import { getHorseIcon } from '../../utils/horseIcons';

interface HorseIconRowProps {
  colors: HorseColor[];
  size?: number;
  maxVisible?: number;
}

export default function HorseIconRow({ colors, size = 28, maxVisible = 4 }: HorseIconRowProps) {
  if (colors.length === 0) {
    return null;
  }

  const visibleColors = colors.slice(0, maxVisible);
  const overflowCount = colors.length - visibleColors.length;

  return (
    <View style={styles.row}>
      {visibleColors.map((color, index) => (
        <Image
          key={`${color}-${index}`}
          source={getHorseIcon(color)}
          style={[
            styles.icon,
            { width: size, height: size },
            index > 0 && styles.iconOverlap,
          ]}
        />
      ))}
      {overflowCount > 0 ? (
        <Text style={[styles.overflow, { lineHeight: size }]}>+{overflowCount}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 32,
  },
  icon: {
    resizeMode: 'contain',
  },
  iconOverlap: {
    marginLeft: -6,
  },
  overflow: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
  },
});
