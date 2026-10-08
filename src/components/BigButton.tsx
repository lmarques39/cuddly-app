import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { fontFamily, radii, spacing, touchTarget } from '../theme/tokens';
import { createStyles, useTheme } from '../theme/ThemeProvider';

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
export function BigButton({ label, onPress, background, foreground, icon, full, style }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const textColor = foreground ?? colors.surface;
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
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((colors, type) => ({
  button: {
    minHeight: touchTarget.minHeight,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.inkBorder,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  full: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontFamily: fontFamily.bodyBold, fontSize: 15.5 },
}));
