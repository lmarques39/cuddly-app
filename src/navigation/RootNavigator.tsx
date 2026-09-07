import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { BottleScreen } from '../features/bottle/BottleScreen';
import { BreastfeedingScreen } from '../features/breastfeeding/BreastfeedingScreen';
import { ContractionsScreen } from '../features/contractions/ContractionsScreen';
import { DiapersScreen } from '../features/diapers/DiapersScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { colors, fontFamily } from '../theme/tokens';
import { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

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
      <Tab.Screen name="Contrações" component={ContractionsScreen} />
      <Tab.Screen name="Amamentação" component={BreastfeedingScreen} />
      <Tab.Screen name="Biberão" component={BottleScreen} />
      <Tab.Screen name="Fraldas" component={DiapersScreen} />
    </Tab.Navigator>
  );
}
