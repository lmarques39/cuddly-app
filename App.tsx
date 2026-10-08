// i18n must be initialised before any screen renders (#118).
import i18n, { initLanguage } from './src/i18n';
import { Karla_400Regular, Karla_500Medium, Karla_700Bold } from '@expo-google-fonts/karla';
import { Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  User,
} from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BabyInfo, RegisterBabyScreen } from './src/features/auth/RegisterBabyScreen';
import { CreateAccountScreen } from './src/features/auth/CreateAccountScreen';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { RecoverPasswordScreen } from './src/features/auth/RecoverPasswordScreen';
import { ParentInfo, RegisterParentScreen } from './src/features/auth/RegisterParentScreen';
import { acceptInvite, getPendingInvitesForEmail, PendingInvite } from './src/features/caregivers/acceptInvite';
import { ActiveSessionsProvider } from './src/features/activeSessions/ActiveSessionsProvider';
import { setUpSessionNotifications } from './src/features/activeSessions/sessionNotification';
import { AcceptInviteScreen } from './src/features/caregivers/AcceptInviteScreen';
import { createFamilyForUser } from './src/features/family/createFamily';
import { resolveOnboardingStep } from './src/features/family/resolveOnboarding';
import { useBabyProfile } from './src/features/profile/useBabyProfile';
import { takeAccountDeletionNotice } from './src/features/profile/deleteAccount';
import { CurrentMemberProvider } from './src/features/profile/useCurrentMember';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initNotifications } from './src/notifications/setup';
import { auth } from './src/services/firebase';
import { migrateLocalDataToFirestore } from './src/storage/migrate';
import { flushOutbox, watchConnectivity } from './src/storage/sync';
import { clearAllLocalData } from './src/storage/storage';
import { createStyles, ThemeProvider, useTheme } from './src/theme/ThemeProvider';

type AuthStep = 'login' | 'createAccount' | 'recoverPassword' | 'registerParent' | 'registerBaby' | 'acceptInvite' | 'app';

// react-native-web's Alert.alert() is a no-op (no popup, no console log) —
// errors must be shown inline instead, and Firebase's raw error codes need
// translating to something a user can act on.
function describeAuthError(err: unknown): string {
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return i18n.t('auth.errors.emailInUse');
    case 'auth/invalid-email':
      return i18n.t('auth.errors.invalidEmail');
    case 'auth/weak-password':
      return i18n.t('auth.errors.weakPassword');
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return i18n.t('auth.errors.wrongCredentials');
    case 'auth/user-not-found':
      return i18n.t('auth.errors.userNotFound');
    case 'auth/too-many-requests':
      return i18n.t('auth.errors.tooManyRequests');
    case 'auth/network-request-failed':
      return i18n.t('auth.errors.network');
    default:
      return err instanceof Error ? err.message : i18n.t('auth.errors.generic');
  }
}

type Route = { step: AuthStep; invite: PendingInvite | null };

/**
 * Where a brand new account goes (either sign-up path). A pending invite for
 * this email routes to accepting it instead of the normal "create your own
 * family" onboarding — otherwise the invite would sit forever un-accepted
 * while the person builds an unrelated family. An existing account invited
 * to a second family isn't handled (this app's data model assumes one family
 * per user) — deliberately out of scope, see #61's discussion.
 */
async function routeNewUser(email: string): Promise<Route> {
  const invites = await getPendingInvitesForEmail(email).catch(() => []);
  return invites.length > 0 ? { step: 'acceptInvite', invite: invites[0] } : { step: 'registerParent', invite: null };
}

/**
 * Where an account that already existed goes — login, a returning Google
 * user, reopening the app. It can still be missing its family or baby
 * profile (see resolveOnboarding.ts), so it's sent to whichever onboarding
 * step is missing instead of straight into an empty app.
 */
async function routeExistingUser(uid: string, email: string): Promise<Route> {
  const step = await resolveOnboardingStep(uid);
  if (step !== 'registerParent') return { step, invite: null };
  // Whatever's cached on this device belonged to a family this account no longer has.
  await clearAllLocalData().catch(() => {});
  return routeNewUser(email);
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { colors, scheme } = useTheme();
  const styles = useStyles();
  // Screen/card colours come from our own styles; this only keeps React
  // Navigation's own surfaces (screen backdrop, transitions) on the same theme.
  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: colors.paper, card: colors.surface, text: colors.ink, border: colors.inkBorder, primary: colors.primary } };
  }, [scheme, colors]);
  const [fontsLoaded] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Karla_400Regular,
    Karla_500Medium,
    Karla_700Bold,
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
  const { save: saveBabyProfile } = useBabyProfile();

  useEffect(() => {
    // Foreground display rules + Android channels/buttons — reminders (#14)
    // and running timers (#101) both need these before posting anything.
    initNotifications()
      .then(setUpSessionNotifications)
      .catch(() => {});
    initLanguage();
    // The notification's Ver/Terminar buttons are registered with the
    // current language's labels — re-register them when it changes.
    const onLanguageChanged = () => setUpSessionNotifications().catch(() => {});
    i18n.on('languageChanged', onLanguageChanged);
    return () => i18n.off('languageChanged', onLanguageChanged);
  }, []);

  useEffect(() => {
    // Only the very first callback (app boot) should auto-skip Login for an
    // already-signed-in user — later callbacks are driven by the handlers
    // below (e.g. sign-up must still visit RegisterParent, not jump to app).
    let isInitialCheck = true;
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (isInitialCheck) {
        isInitialCheck = false;
        // Keep the loading spinner up until we know where this account belongs.
        if (nextUser) {
          const { step, invite } = await routeExistingUser(nextUser.uid, nextUser.email ?? '');
          setPendingInvite(invite);
          setAuthStep(step);
        }
        setAuthChecked(true);
      } else if (!nextUser) {
        // signed out from within the app (Perfil > Terminar sessão, or an
        // account deletion — which leaves a notice here if it half-failed)
        setAuthError(takeAccountDeletionNotice());
        setAuthStep('login');
      }
    });
  }, []);

  useEffect(() => {
    // Replays writes queued while offline (#56) — on entering the app and
    // every time the connection comes back (#107).
    if (authStep !== 'app' || !user) return;
    flushOutbox();
    return watchConnectivity();
  }, [authStep, user]);

  useEffect(() => {
    // One-time push of pre-existing local data into this account's family —
    // see migrate.ts. No-ops instantly on every later render once the flag
    // it sets is in place, so this is safe to leave unconditional here.
    if (authStep === 'app' && user) {
      migrateLocalDataToFirestore(user.uid);
    }
  }, [authStep, user]);

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { user: signedIn } = await signInWithEmailAndPassword(auth, email, password);
      applyRoute(await routeExistingUser(signedIn.uid, email));
    } catch (err) {
      setAuthError(describeAuthError(err));
    }
  };

  const applyRoute = ({ step, invite }: Route) => {
    setPendingInvite(invite);
    setAuthStep(step);
  };

  const handleCreateAccount = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // AsyncStorage is per-device, not per-account — wipe whatever the
      // previous signed-in account on this device left behind, so a brand
      // new account actually starts blank instead of inheriting old
      // trackers/baby profile. Best-effort: the account already exists at
      // this point, so a storage hiccup here shouldn't block sign-up.
      await clearAllLocalData().catch(() => {});
      applyRoute(await routeNewUser(email));
    } catch (err) {
      setAuthError(describeAuthError(err));
    }
  };

  const handleContinueWithGoogle = async (idToken: string) => {
    setAuthError(null);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      if (getAdditionalUserInfo(result)?.isNewUser) {
        // Same per-device AsyncStorage caveat as handleCreateAccount below.
        await clearAllLocalData().catch(() => {});
        applyRoute(await routeNewUser(result.user.email ?? ''));
      } else {
        applyRoute(await routeExistingUser(result.user.uid, result.user.email ?? ''));
      }
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: unknown }).code : '';
      // With an idToken there's no password involved — invalid-credential
      // here means Firebase didn't accept the Google client that issued it
      // (see #78), not a typo, so describeAuthError's message would mislead.
      setAuthError(
        code === 'auth/invalid-credential'
          ? i18n.t('auth.google.notAccepted')
          : describeAuthError(err),
      );
    }
  };

  const handleSendResetEmail = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setAuthError(describeAuthError(err));
      throw err; // let RecoverPasswordScreen know not to show its "sent" confirmation
    }
  };

  const handleAcceptInvite = async (name: string) => {
    setAuthError(null);
    if (!pendingInvite || !auth.currentUser) return;
    try {
      await acceptInvite(pendingInvite, auth.currentUser.uid, name);
      setPendingInvite(null);
      setAuthStep('app');
    } catch (err) {
      setAuthError(describeAuthError(err));
    }
  };

  const handleDeclineInvite = () => {
    setAuthError(null);
    setPendingInvite(null);
    setAuthStep('registerParent');
  };

  const handleParentContinue = async (parent: ParentInfo) => {
    setAuthError(null);
    if (user) {
      try {
        // Creates families/{familyId} + families/{familyId}/members/{uid},
        // and points users/{uid} at it — see firestore.rules for the shape
        // this is expected to match.
        await createFamilyForUser(user.uid, parent);
      } catch (err) {
        setAuthError(describeAuthError(err));
        return;
      }
    }
    setAuthStep('registerBaby');
  };

  const handleBabyFinish = async (baby: BabyInfo) => {
    // useBabyProfile's save() writes to AsyncStorage and queues the Firestore
    // sync — see src/features/profile/useBabyProfile.ts.
    await saveBabyProfile({
      name: baby.name || undefined,
      dueDate: baby.dueDate,
      birthDate: baby.birthDate,
      sex: baby.sex,
    });
    setAuthStep('app');
  };

  if (!fontsLoaded || !authChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {authStep === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onContinueWithGoogle={handleContinueWithGoogle}
          onCreateAccount={() => {
            setAuthError(null);
            setAuthStep('createAccount');
          }}
          onForgotPassword={() => {
            setAuthError(null);
            setAuthStep('recoverPassword');
          }}
          error={authError}
        />
      )}
      {authStep === 'createAccount' && (
        <CreateAccountScreen
          onCreateAccount={handleCreateAccount}
          onBack={() => {
            setAuthError(null);
            setAuthStep('login');
          }}
          error={authError}
        />
      )}
      {authStep === 'recoverPassword' && (
        <RecoverPasswordScreen
          onSend={handleSendResetEmail}
          onBack={() => {
            setAuthError(null);
            setAuthStep('login');
          }}
          error={authError}
        />
      )}
      {authStep === 'acceptInvite' && pendingInvite && (
        <AcceptInviteScreen
          inviterName={pendingInvite.invitedByName}
          defaultName={auth.currentUser?.displayName ?? ''}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
          error={authError}
        />
      )}
      {authStep === 'registerParent' && (
        <RegisterParentScreen email={user?.email ?? ''} onContinue={handleParentContinue} error={authError} />
      )}
      {authStep === 'registerBaby' && <RegisterBabyScreen onFinish={handleBabyFinish} />}
      {authStep === 'app' && (
        <CurrentMemberProvider>
          <ActiveSessionsProvider>
            <NavigationContainer theme={navigationTheme}>
              <RootNavigator />
            </NavigationContainer>
          </ActiveSessionsProvider>
        </CurrentMemberProvider>
      )}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

const useStyles = createStyles((colors, type) => ({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
}));
