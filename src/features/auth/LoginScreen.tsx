import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { PasswordField } from '../../components/PasswordField';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { isGoogleSignInAvailable, PLACEHOLDER_ANDROID_CLIENT_ID } from './googleAuthAvailability';

// Dismisses the in-app browser once the OAuth redirect completes — the
// standard expo-auth-session pattern, needs to run once at module load.
WebBrowser.maybeCompleteAuthSession();

type Props = {
  onLogin: (email: string, password: string) => void;
  onContinueWithGoogle: (idToken: string) => void;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
  error?: string | null;
};

export function LoginScreen({ onLogin, onContinueWithGoogle, onCreateAccount, onForgotPassword, error }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleSignInAvailable = isGoogleSignInAvailable(Platform.OS, { android: androidClientId, web: webClientId });

  const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    webClientId,
    // Always truthy, even when unconfigured — expo-auth-session throws
    // synchronously (crashing this whole screen, not just the button) if
    // the current platform's own client id is missing. googleSignInAvailable
    // is what actually gates whether the button below can be pressed.
    androidClientId: androidClientId ?? PLACEHOLDER_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params.id_token) {
      onContinueWithGoogle(googleResponse.params.id_token);
    }
  }, [googleResponse, onContinueWithGoogle]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.logoBadge} />
          <Text style={styles.wordmark}>cuddly</Text>
          <Text style={[type.caption, styles.tagline]}>Acompanha a gravidez e os primeiros meses, com calma.</Text>
        </View>

        <View style={{ gap: spacing.md }}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View>
            <Text style={type.caption}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.inkMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View>
            <View style={styles.row}>
              <Text style={type.caption}>Password</Text>
              <Pressable onPress={onForgotPassword} hitSlop={8}>
                <Text style={[type.caption, styles.link]}>Esqueci-me</Text>
              </Pressable>
            </View>
            <PasswordField value={password} onChangeText={setPassword} placeholder="••••••••" />
          </View>

          <BigButton
            label="Entrar"
            background={colors.action}
            foreground={colors.actionInk}
            onPress={() => onLogin(email, password)}
            full
            style={{ marginTop: spacing.xs }}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={[type.caption, { color: colors.inkMuted }]}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={() => promptGoogleSignIn()}
            disabled={!googleRequest || !googleSignInAvailable}
            style={[styles.googleButton, (!googleRequest || !googleSignInAvailable) && { opacity: 0.5 }]}
          >
            <Text style={styles.googleLabel}>Continuar com Google</Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={type.caption}>Ainda não tens conta?</Text>
          <Pressable onPress={onCreateAccount}>
            <Text style={[type.caption, styles.link, { fontFamily: fontFamily.bodyBold }]}>Criar conta</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, justifyContent: 'center', gap: spacing.xl, paddingHorizontal: spacing.lg },
  brand: { alignItems: 'center', gap: spacing.sm },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  wordmark: { fontFamily: fontFamily.display, fontSize: 26, color: colors.ink },
  tagline: { textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  link: { color: colors.primary },
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  googleButton: {
    minHeight: 56,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLabel: { fontFamily: fontFamily.bodyBold, fontSize: 15, color: colors.ink },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  errorBox: {
    backgroundColor: colors.coralBg,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  errorText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.coral },
});
