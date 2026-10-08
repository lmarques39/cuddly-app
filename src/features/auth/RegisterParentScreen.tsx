import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';

export type ParentRole = 'mae' | 'pai' | 'cuidador';

export type ParentInfo = {
  name: string;
  role: ParentRole;
  email: string;
  phone: string;
};

type Props = {
  // Already captured on the previous screen (account creation) — shown
  // read-only here instead of asked again.
  email: string;
  onContinue: (parent: ParentInfo) => void;
  error?: string | null;
};

/** Translation key of each role's label (#118) — render with t(ROLE_LABEL[role]). */
export const ROLE_LABEL = {
  mae: 'auth.parent.roles.mae',
  pai: 'auth.parent.roles.pai',
  cuidador: 'auth.parent.roles.cuidador',
} as const satisfies Record<ParentRole, string>;

export function RegisterParentScreen({ email, onContinue, error }: Props) {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const [name, setName] = useState('');
  const [role, setRole] = useState<ParentRole>('mae');
  const [phone, setPhone] = useState('');

  const canContinue = name.trim().length > 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressSegment, { backgroundColor: colors.surfaceSunken }]} />
        </View>

        <View>
          <Text style={type.h1}>{t('auth.parent.title')}</Text>
          <Text style={[type.body, { color: colors.inkSecondary, marginTop: spacing.xs }]}>
            {t('auth.parent.subtitle')}
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View>
          <Text style={type.caption}>{t('auth.parent.name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('auth.parent.namePlaceholder')}
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, { fontFamily: fontFamily.bodyBold, fontSize: 16 }]}
          />
        </View>

        <View style={styles.emailRow}>
          <Text style={type.caption}>{t('auth.parent.account')}</Text>
          <Text style={[type.body, { fontFamily: fontFamily.bodyMedium }]}>{email}</Text>
        </View>

        <View>
          <Text style={type.caption}>{t('auth.parent.role')}</Text>
          <View style={styles.roleRow}>
            {(Object.keys(ROLE_LABEL) as ParentRole[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={[styles.rolePill, { backgroundColor: role === r ? colors.action : colors.surfaceSunken }]}
              >
                <Text
                  style={{
                    fontFamily: fontFamily.bodyMedium,
                    fontSize: 12.5,
                    color: role === r ? colors.actionInk : colors.inkSecondary,
                  }}
                >
                  {t(ROLE_LABEL[r])}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={type.caption}>{t('auth.parent.phone')}</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+351"
            placeholderTextColor={colors.inkMuted}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <BigButton
          label={t('common.continue')}
          background={canContinue ? colors.action : colors.surfaceSunken}
          foreground={canContinue ? colors.actionInk : colors.inkMuted}
          onPress={() => canContinue && onContinue({ name: name.trim(), role, email, phone: phone.trim() })}
          full
        />
        <Text style={[type.caption, { textAlign: 'center', color: colors.inkMuted, marginTop: spacing.sm }]}>
          {t('auth.step', { step: 1, total: 2 })}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  progressRow: { flexDirection: 'row', gap: spacing.sm },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  emailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    marginTop: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.ink,
  },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  rolePill: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: 'center' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.sm },
  errorBox: {
    backgroundColor: colors.coralBg,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  errorText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.coral },
}));
