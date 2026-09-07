import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { PerfilStackParamList } from '../../navigation/types';
import { colors, fontFamily, spacing, type } from '../../theme/tokens';

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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Perfil</Text>

      <Card style={{ gap: spacing.xs }}>
        <Text style={[type.body, { fontFamily: fontFamily.bodyBold }]}>Sem sessão iniciada</Text>
        <Text style={type.caption}>A autenticação (email/password + Google) chega com o Firebase.</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
