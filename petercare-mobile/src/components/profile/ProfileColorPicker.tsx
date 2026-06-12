import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ProfileColorKey } from '../../types/user';
import { PROFILE_COLOR_OPTIONS } from '../../utils/userColors';

interface ProfileColorPickerProps {
  value: ProfileColorKey;
  onChange: (color: ProfileColorKey) => void;
}

export default function ProfileColorPicker({ value, onChange }: ProfileColorPickerProps) {
  return (
    <View style={styles.container}>
      {PROFILE_COLOR_OPTIONS.map((option) => {
        const isSelected = option.key === value;

        return (
          <Pressable
            key={option.key}
            style={[styles.swatchButton, isSelected && styles.swatchButtonSelected]}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isSelected }}
          >
            <View style={[styles.swatch, { backgroundColor: option.hex }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchButton: {
    padding: 3,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  swatchButtonSelected: {
    borderColor: '#3498DB',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D5DBDB',
  },
});
