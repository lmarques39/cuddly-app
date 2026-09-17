import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';

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
        <Text style={type.h1}>Foste convidado(a)!</Text>
        <Text style={[type.body, { color: colors.inkSecondary }]}>
          {inviterName ? `${inviterName} convidou-te` : 'Foste convidado(a)'} para seres cuidador(a) na Cuddly — vais
          poder ver e registar os cuidados do bebé com o resto da família.
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View>
          <Text style={type.caption}>O teu nome</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Como te devemos chamar?"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <BigButton
          label={accepting ? 'A aceitar…' : 'Aceitar convite'}
          background={canAccept ? colors.action : colors.surfaceSunken}
          foreground={canAccept ? colors.actionInk : colors.inkMuted}
          onPress={handleAccept}
          full
        />
        <Pressable onPress={onDecline} hitSlop={12} style={styles.declineLink}>
          <Text style={[type.caption, styles.link]}>Não, quero criar a minha própria família</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
