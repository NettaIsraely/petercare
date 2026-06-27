import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface JumpToTodayButtonProps {
  label: 'Today' | 'This week';
  onPress: () => void;
  accessibilityLabel?: string;
  variant?: 'pill' | 'compact-pill' | 'inline';
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  pillButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  compactPillButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  inlineButton: {
    paddingVertical: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3498DB',
  },
});

const VARIANT_STYLES = {
  pill: styles.pillButton,
  'compact-pill': styles.compactPillButton,
  inline: styles.inlineButton,
} as const;

export default function JumpToTodayButton({
  label,
  onPress,
  accessibilityLabel,
  variant = 'pill',
  style,
}: JumpToTodayButtonProps) {
  return (
    <TouchableOpacity
      style={[VARIANT_STYLES[variant], style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
