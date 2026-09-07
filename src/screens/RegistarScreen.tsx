import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../components/BigButton';
import { useBabyProfile } from '../features/profile/useBabyProfile';
import { RegistarStackParamList } from '../navigation/types';
import { colors, spacing, type } from '../theme/tokens';

type Nav = NativeStackNavigationProp<RegistarStackParamList, 'RegistarHub'>;

export function RegistarScreen() {
  const navigation = useNavigation<Nav>();
  const { mode, refresh } = useBabyProfile();

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Registar</Text>
      <Text style={type.body}>{mode === 'gravida' ? 'O que se passa agora?' : 'O que queres registar?'}</Text>

      <View style={styles.grid}>
        {mode === 'gravida' ? (
          <BigButton
            style={styles.gridItem}
            label="Contração"
            background={colors.domain.contractions.bg}
            foreground={colors.domain.contractions.ink}
            onPress={() => navigation.navigate('Contrações')}
          />
        ) : (
          <>
            <BigButton
              style={styles.gridItem}
              label="Amamentar"
              background={colors.domain.breastfeeding.bg}
              foreground={colors.domain.breastfeeding.ink}
              onPress={() => navigation.navigate('Amamentação')}
            />
            <BigButton
              style={styles.gridItem}
              label="Biberão"
              background={colors.domain.bottle.bg}
              foreground={colors.domain.bottle.ink}
              onPress={() => navigation.navigate('Biberão')}
            />
            <BigButton
              style={styles.gridItem}
              label="Fralda"
              background={colors.domain.diapers.bg}
              foreground={colors.domain.diapers.ink}
              onPress={() => navigation.navigate('Fraldas')}
            />
          </>
        )}
        <BigButton
          style={styles.gridItem}
          label="Marcar consulta"
          background={colors.surfaceSunken}
          foreground={colors.ink}
          onPress={() => navigation.navigate('MarcarConsulta')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: { flexBasis: '47%', flexGrow: 1, minHeight: 88 },
});
