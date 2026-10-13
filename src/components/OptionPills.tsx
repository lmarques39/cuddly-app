import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { fontFamily, radii, spacing } from '../theme/tokens';
import { createStyles } from '../theme/ThemeProvider';

type Props<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: (value: T) => string;
};

/** A row of pill buttons, one of which is picked — day, breast side… */
export function OptionPills<T extends string>({ options, value, onChange, label }: Props<T>) {
  const styles = useStyles();
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === option }}
          onPress={() => onChange(option)}
          style={[styles.pill, value === option && styles.pillOn]}
        >
          <Text style={[styles.label, value === option && styles.labelOn]}>{label(option)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = createStyles((colors, type) => ({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: colors.inkSecondary },
  labelOn: { color: colors.primaryInk, fontFamily: fontFamily.bodyBold },
}));
