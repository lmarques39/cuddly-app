import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';

type Props = {
  inviterName: string | null;
  defaultName: string;
  onAccept: (name: string) => Promise<void>;
  onDecline: () => void;
  error?: string | null;
};

/**
 * Shown instead of the normal "criar a tua família" onboarding when a brand
 * new sign-up's email matches a pending invite (see App.tsx's routeNewUser).
 * acceptInvite() needs a name — defaultName comes from the Google profile
 * when signing in via OAuth, but stays editable either way.
 */
export function AcceptInviteScreen({ inviterName, defaultName, onAccept, onDecline, error }: Props) {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const [name, setName] = useState(defaultName);
  const [accepting, setAccepting] = useState(false);

  const canAccept = name.trim().length > 0 && !accepting;

  const handleAccept = async () => {
    if (!canAccept) return;
    setAccepting(true);
    try {
      await onAccept(name.trim());
    } finally {
      setAccepting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <Text style={type.h1}>{t('caregivers.accept.title')}</Text>
        <Text style={[type.body, { color: colors.inkSecondary }]}>
          {inviterName ? t('caregivers.accept.byName', { name: inviterName }) : t('caregivers.accept.anonymous')}
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View>
          <Text style={type.caption}>{t('caregivers.accept.name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('caregivers.accept.namePlaceholder')}
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <BigButton
          label={accepting ? t('caregivers.accept.accepting') : t('caregivers.accept.accept')}
          background={canAccept ? colors.action : colors.surfaceSunken}
          foreground={canAccept ? colors.actionInk : colors.inkMuted}
          onPress={handleAccept}
          full
        />
        <Pressable onPress={onDecline} hitSlop={12} style={styles.declineLink}>
          <Text style={[type.caption, styles.link]}>{t('caregivers.accept.decline')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  link: { color: colors.primary, fontFamily: fontFamily.bodyBold },
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
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm },
  declineLink: { alignItems: 'center' },
  errorBox: {
    backgroundColor: colors.coralBg,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  errorText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.coral },
}));
