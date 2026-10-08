import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { LanguagePreference, loadLanguagePreference, setLanguagePreference } from '../i18n';
import { createStyles, useTheme } from '../theme/ThemeProvider';
import { fontFamily, radii, spacing } from '../theme/tokens';
import { Card } from './Card';

const OPTIONS: LanguagePreference[] = ['system', 'pt', 'en'];

/** Perfil → Idioma (#118): follow the phone, or force Portuguese/English. Saved on this device only. */
export function LanguagePicker() {
  const { t } = useTranslation();
  const { type } = useTheme();
  const styles = useStyles();
  const [preference, setPreference] = useState<LanguagePreference>('system');

  useEffect(() => {
    loadLanguagePreference().then(setPreference);
  }, []);

  const choose = (next: LanguagePreference) => {
    setPreference(next);
    setLanguagePreference(next);
  };

  return (
    <Card style={styles.card}>
      <Text style={type.body}>{t('language.title')}</Text>
      <View style={styles.pills} accessibilityRole="radiogroup">
        {OPTIONS.map((option) => {
          const selected = preference === option;
          const label = t(`language.${option}`);
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t('language.a11y', { option: label })}
              onPress={() => choose(option)}
              style={[styles.pill, selected && styles.pillOn]}
            >
              <Text style={[styles.pillLabel, selected && styles.pillLabelOn]}>{label}</Text>
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
