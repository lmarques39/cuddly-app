import { Karla_400Regular, Karla_500Medium, Karla_700Bold } from '@expo-google-fonts/karla';
import { Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
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
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BabyInfo, RegisterBabyScreen } from './src/features/auth/RegisterBabyScreen';
import { CreateAccountScreen } from './src/features/auth/CreateAccountScreen';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { RecoverPasswordScreen } from './src/features/auth/RecoverPasswordScreen';
import { ParentInfo, RegisterParentScreen } from './src/features/auth/RegisterParentScreen';
import { createFamilyForUser } from './src/features/family/createFamily';
import { useBabyProfile } from './src/features/profile/useBabyProfile';
import { RootNavigator } from './src/navigation/RootNavigator';
import { auth } from './src/services/firebase';
import { migrateLocalDataToFirestore } from './src/storage/migrate';
import { clearAllLocalData } from './src/storage/storage';
import { colors } from './src/theme/tokens';

type AuthStep = 'login' | 'createAccount' | 'recoverPassword' | 'registerParent' | 'registerBaby' | 'app';

// react-native-web's Alert.alert() is a no-op (no popup, no console log) —
// errors must be shown inline instead, and Firebase's raw error codes need
// translating to something a user can act on.
function describeAuthError(err: unknown): string {
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com este email. Tenta entrar em vez de criar conta.';
    case 'auth/invalid-email':
      return 'Este email não parece válido.';
    case 'auth/weak-password':
      return 'A password tem de ter pelo menos 6 caracteres.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Email ou password incorretos.';
    case 'auth/user-not-found':
      return 'Não existe nenhuma conta com este email.';
    case 'auth/too-many-requests':
      return 'Demasiadas tentativas seguidas. Espera um pouco e tenta novamente.';
    case 'auth/network-request-failed':
      return 'Sem ligação à internet.';
    default:
      return err instanceof Error ? err.message : 'Algo correu mal. Tenta novamente.';
  }
}

export default function App() {
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
  const { save: saveBabyProfile } = useBabyProfile();

  useEffect(() => {
    // Only the very first callback (app boot) should auto-skip Login for an
    // already-signed-in user — later callbacks are driven by the handlers
    // below (e.g. sign-up must still visit RegisterParent, not jump to app).
    let isInitialCheck = true;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (isInitialCheck) {
        isInitialCheck = false;
        setAuthChecked(true);
        if (nextUser) setAuthStep('app');
      } else if (!nextUser) {
        // signed out from within the app (Perfil > Terminar sessão)
        setAuthStep('login');
      }
    });
  }, []);

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
      await signInWithEmailAndPassword(auth, email, password);
      setAuthStep('app');
    } catch (err) {
      setAuthError(describeAuthError(err));
    }
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
      setAuthStep('registerParent');
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
        setAuthStep('registerParent');
      } else {
        setAuthStep('app');
      }
    } catch (err) {
      setAuthError(describeAuthError(err));
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
      {authStep === 'registerParent' && (
        <RegisterParentScreen email={user?.email ?? ''} onContinue={handleParentContinue} error={authError} />
      )}
      {authStep === 'registerBaby' && <RegisterBabyScreen onFinish={handleBabyFinish} />}
      {authStep === 'app' && (
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      )}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
});
