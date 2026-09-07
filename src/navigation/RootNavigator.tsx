import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AppointmentsScreen } from '../features/appointments/AppointmentsScreen';
import { BottleScreen } from '../features/bottle/BottleScreen';
import { BreastfeedingScreen } from '../features/breastfeeding/BreastfeedingScreen';
import { ContractionsScreen } from '../features/contractions/ContractionsScreen';
import { DiapersScreen } from '../features/diapers/DiapersScreen';
import { BabyProfileScreen } from '../features/profile/BabyProfileScreen';
import { CuidadoresScreen } from '../features/profile/CuidadoresScreen';
import { NotificacoesScreen } from '../features/profile/NotificacoesScreen';
import { PerfilScreen } from '../features/profile/PerfilScreen';
import { PrivacidadeScreen } from '../features/profile/PrivacidadeScreen';
import { HistoricoScreen } from '../screens/HistoricoScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RegistarScreen } from '../screens/RegistarScreen';
import { colors, fontFamily } from '../theme/tokens';
import { PerfilStackParamList, RegistarStackParamList, RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const RegistarStack = createNativeStackNavigator<RegistarStackParamList>();
const PerfilStack = createNativeStackNavigator<PerfilStackParamList>();

// pushed screens keep their own in-content <Text style={type.h1}> title, so the
// native header is trimmed down to just a back chevron over a matching background
const nestedStackScreenOptions = {
  headerShown: true,
  headerTitle: '',
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.paper },
  headerTintColor: colors.ink,
} as const;

function RegistarNavigator() {
  return (
    <RegistarStack.Navigator screenOptions={nestedStackScreenOptions}>
      <RegistarStack.Screen name="RegistarHub" component={RegistarScreen} options={{ headerShown: false }} />
      <RegistarStack.Screen name="Contrações" component={ContractionsScreen} />
      <RegistarStack.Screen name="Amamentação" component={BreastfeedingScreen} />
      <RegistarStack.Screen name="Biberão" component={BottleScreen} />
      <RegistarStack.Screen name="Fraldas" component={DiapersScreen} />
      <RegistarStack.Screen name="MarcarConsulta" component={AppointmentsScreen} />
    </RegistarStack.Navigator>
  );
}

function PerfilNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={nestedStackScreenOptions}>
      <PerfilStack.Screen name="PerfilHub" component={PerfilScreen} options={{ headerShown: false }} />
      <PerfilStack.Screen name="PerfilDoBebe" component={BabyProfileScreen} />
      <PerfilStack.Screen name="ConsultasMedicas" component={AppointmentsScreen} />
      <PerfilStack.Screen name="Cuidadores" component={CuidadoresScreen} />
      <PerfilStack.Screen name="Notificacoes" component={NotificacoesScreen} />
      <PerfilStack.Screen name="PrivacidadeDados" component={PrivacidadeScreen} />
    </PerfilStack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fontFamily.bodyMedium, fontSize: 11 },
      }}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Registar" component={RegistarNavigator} />
      <Tab.Screen name="Histórico" component={HistoricoScreen} />
      <Tab.Screen name="Perfil" component={PerfilNavigator} />
    </Tab.Navigator>
  );
}
