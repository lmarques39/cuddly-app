import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AppointmentsScreen } from '../features/appointments/AppointmentsScreen';
import { BottleScreen } from '../features/bottle/BottleScreen';
import { BreastfeedingScreen } from '../features/breastfeeding/BreastfeedingScreen';
import { ContractionsScreen } from '../features/contractions/ContractionsScreen';
import { DiapersScreen } from '../features/diapers/DiapersScreen';
import { PumpingScreen } from '../features/pumping/PumpingScreen';
import { BabyProfileScreen } from '../features/profile/BabyProfileScreen';
import { CuidadoresScreen } from '../features/profile/CuidadoresScreen';
import { NotificacoesScreen } from '../features/profile/NotificacoesScreen';
import { PerfilScreen } from '../features/profile/PerfilScreen';
import { PrivacidadeScreen } from '../features/profile/PrivacidadeScreen';
import { SonoScreen } from '../features/sono/SonoScreen';
import { HistoricoScreen } from '../screens/HistoricoScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RegistarScreen } from '../screens/RegistarScreen';
import { colors, fontFamily } from '../theme/tokens';
import { PerfilStackParamList, RegistarStackParamList, RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const RegistarStack = createNativeStackNavigator<RegistarStackParamList>();
const PerfilStack = createNativeStackNavigator<PerfilStackParamList>();

// Each tab keeps its own colour identity (wireframe convention) instead of
// a single active/inactive tint — only the icon fill (outline vs solid)
// changes with focus.
const TAB_COLOR = {
  Início: '#D9A22C',
  Registar: '#C9932E',
  Histórico: '#D6748F',
  Perfil: '#4E7CAA',
} as const;

const TAB_ICON = {
  Início: 'home',
  Registar: 'checkbox',
  Histórico: 'time',
  Perfil: 'person',
} as const;

function makeTabBarIcon(tab: keyof typeof TAB_ICON) {
  function TabIcon({ focused, size }: { focused: boolean; size: number }) {
    return (
      <Ionicons
        name={focused ? TAB_ICON[tab] : (`${TAB_ICON[tab]}-outline` as const)}
        size={size}
        color={TAB_COLOR[tab]}
      />
    );
  }
  TabIcon.displayName = `TabIcon(${tab})`;
  return TabIcon;
}

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
      <RegistarStack.Screen name="Sono" component={SonoScreen} />
      <RegistarStack.Screen name="Pumping" component={PumpingScreen} />
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
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.inkBorder, borderTopWidth: 2 },
        tabBarLabelStyle: { fontFamily: fontFamily.bodyBold, fontSize: 10.5 },
      }}
    >
      <Tab.Screen
        name="Início"
        component={HomeScreen}
        options={{ tabBarIcon: makeTabBarIcon('Início'), tabBarActiveTintColor: TAB_COLOR.Início, tabBarInactiveTintColor: TAB_COLOR.Início }}
      />
      <Tab.Screen
        name="Registar"
        component={RegistarNavigator}
        options={{ tabBarIcon: makeTabBarIcon('Registar'), tabBarActiveTintColor: TAB_COLOR.Registar, tabBarInactiveTintColor: TAB_COLOR.Registar }}
      />
      <Tab.Screen
        name="Histórico"
        component={HistoricoScreen}
        options={{ tabBarIcon: makeTabBarIcon('Histórico'), tabBarActiveTintColor: TAB_COLOR.Histórico, tabBarInactiveTintColor: TAB_COLOR.Histórico }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilNavigator}
        options={{ tabBarIcon: makeTabBarIcon('Perfil'), tabBarActiveTintColor: TAB_COLOR.Perfil, tabBarInactiveTintColor: TAB_COLOR.Perfil }}
      />
    </Tab.Navigator>
  );
}
