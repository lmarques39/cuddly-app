import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontFamily, radii, spacing, touchTarget } from '../theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  background: string;
  foreground?: string;
  icon?: React.ReactNode;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Large, one-hand-friendly tap target used for every primary action. */
export function BigButton({ label, onPress, background, foreground = colors.surface, icon, full, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: pressed ? 0.85 : 1 },
        full && styles.full,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon}
        <Text style={[styles.label, { color: foreground }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget.minHeight,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  full: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontFamily: fontFamily.bodyBold, fontSize: 15.5 },
});
