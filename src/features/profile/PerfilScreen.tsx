import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { PerfilStackParamList } from '../../navigation/types';
import { auth } from '../../services/firebase';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';

type Nav = NativeStackNavigationProp<PerfilStackParamList, 'PerfilHub'>;

const SETTINGS: { label: string; route: keyof PerfilStackParamList }[] = [
  { label: 'Perfil do bebé', route: 'PerfilDoBebe' },
  { label: 'Consultas médicas', route: 'ConsultasMedicas' },
  { label: 'Cuidadores', route: 'Cuidadores' },
  { label: 'Notificações', route: 'Notificacoes' },
  { label: 'Privacidade e dados', route: 'PrivacidadeDados' },
];

export function PerfilScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState<string | null>(auth.currentUser?.email ?? null);

  useEffect(() => onAuthStateChanged(auth, (user) => setEmail(user?.email ?? null)), []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Perfil</Text>

      <Card style={{ gap: spacing.xs }}>
        <Text style={[type.body, { fontFamily: fontFamily.bodyBold }]}>{email ?? 'Sem sessão iniciada'}</Text>
        <Text style={type.caption}>Conta com email e password (Firebase).</Text>
      </Card>

      <View style={{ gap: spacing.sm }}>
        {SETTINGS.map((item) => (
          <Pressable key={item.route} onPress={() => navigation.navigate(item.route)}>
            <Card style={styles.row}>
              <Text style={type.body}>{item.label}</Text>
              <Text style={type.caption}>›</Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => signOut(auth)} style={styles.logoutButton}>
        <Text style={styles.logoutLabel}>Terminar sessão</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoutButton: {
    minHeight: 52,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: { fontFamily: fontFamily.bodyBold, fontSize: 14.5, color: colors.coral },
});
