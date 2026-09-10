import { Karla_400Regular, Karla_500Medium, Karla_700Bold } from '@expo-google-fonts/karla';
import { Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BabyInfo, RegisterBabyScreen } from './src/features/auth/RegisterBabyScreen';
import { CreateAccountScreen } from './src/features/auth/CreateAccountScreen';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { ParentInfo, RegisterParentScreen } from './src/features/auth/RegisterParentScreen';
import { useBabyProfile } from './src/features/profile/useBabyProfile';
import { RootNavigator } from './src/navigation/RootNavigator';
import { auth, db } from './src/services/firebase';
import { colors } from './src/theme/tokens';

// Google sign-in still needs expo-auth-session wired to a Google Cloud OAuth
// client (separate console step) — not done yet, "Continuar com Google" is
// a no-op for now.
type AuthStep = 'login' | 'createAccount' | 'registerParent' | 'registerBaby' | 'app';

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
      setAuthStep('registerParent');
    } catch (err) {
      setAuthError(describeAuthError(err));
    }
  };

  const handleParentContinue = async (parent: ParentInfo) => {
    setAuthError(null);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          name: parent.name,
          role: parent.role,
          email: parent.email,
          phone: parent.phone || null,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        setAuthError(describeAuthError(err));
        return;
      }
    }
    setAuthStep('registerBaby');
  };

  const handleBabyFinish = async (baby: BabyInfo) => {
    // Baby profile stays local (AsyncStorage) for now — it's what Início and
    // Registar already read to decide Grávida vs Pós-parto mode. Proper
    // Firestore sync (families/{id}/babyProfile) is separate follow-up work.
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
          onContinueWithGoogle={() => {}}
          onCreateAccount={() => {
            setAuthError(null);
            setAuthStep('createAccount');
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
      {authStep === 'registerParent' && <RegisterParentScreen onContinue={handleParentContinue} error={authError} />}
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
