import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { createStyles, ThemePreference, useTheme } from '../theme/ThemeProvider';
import { fontFamily, radii, spacing } from '../theme/tokens';
import { Card } from './Card';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Automático' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

/** Perfil → Aparência (#117): follow the phone, or force light/dark. Saved on this device only. */
export function AppearancePicker() {
  const { type, preference, setPreference } = useTheme();
  const styles = useStyles();

  return (
    <Card style={styles.card}>
      <Text style={type.body}>Aparência</Text>
      <View style={styles.pills} accessibilityRole="radiogroup">
        {OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Aparência: ${option.label}`}
              onPress={() => setPreference(option.value)}
              style={[styles.pill, selected && styles.pillOn]}
            >
              <Text style={[styles.pillLabel, selected && styles.pillLabelOn]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const useStyles = createStyles((colors) => ({
  card: { gap: spacing.sm },
  pills: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.ink },
  pillLabelOn: { fontFamily: fontFamily.bodyBold, color: colors.primaryInk },
}));
