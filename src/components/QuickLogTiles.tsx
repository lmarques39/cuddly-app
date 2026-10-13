import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useActiveSessions } from '../features/activeSessions/ActiveSessionsProvider';
import { RegistarStackParamList, RootTabParamList } from '../navigation/types';
import { domainColors, fontFamily, radii, spacing } from '../theme/tokens';
import { createStyles } from '../theme/ThemeProvider';
import { ActiveSessionKind, AppMode, BreastSide } from '../types/records';

type Tile = {
  key: string;
  label: string;
  route: keyof RegistarStackParamList;
  icon: keyof typeof Ionicons.glyphMap;
  colors: { bg: string; ink: string };
  /** Timed trackers start counting straight from the tile. */
  timer?: ActiveSessionKind;
};

type Props = {
  mode: AppMode;
  /** The breast the next feed should start on (useBreastfeeding's suggestion). */
  suggestedSide: BreastSide;
};

/**
 * One-tap logging from Início (#128) — the tester's "um clique a menos".
 * A timed tracker (Amamentação, Sono, Extração, Contração) starts its timer
 * right away and opens its screen, where the side can still be changed or
 * the timer paused; the rest just open their screen. A timer that's
 * already running is only opened, never restarted.
 */
export function QuickLogTiles({ mode, suggestedSide }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList, 'Início'>>();
  const { sessions, start } = useActiveSessions();

  const tiles: Tile[] =
    mode === 'gravida'
      ? [{ key: 'contraction', label: t('registar.contraction'), route: 'Contrações', icon: 'pulse', colors: domainColors.contractions, timer: 'contractions' }]
      : [
          { key: 'breastfeeding', label: t('registar.breastfeed'), route: 'Amamentação', icon: 'heart', colors: domainColors.breastfeeding, timer: 'breastfeeding' },
          { key: 'bottle', label: t('registar.bottle'), route: 'Biberão', icon: 'flask', colors: domainColors.bottle },
          { key: 'diaper', label: t('registar.diaper'), route: 'Fraldas', icon: 'water-outline', colors: domainColors.diapers },
          { key: 'sono', label: t('registar.sleep'), route: 'Sono', icon: 'moon', colors: domainColors.sleep, timer: 'sono' },
          { key: 'pumping', label: t('registar.pumping'), route: 'Pumping', icon: 'water', colors: domainColors.pumping, timer: 'pumping' },
        ];

  const open = (tile: Tile) => {
    if (tile.timer && !sessions[tile.timer]) {
      const side = tile.timer === 'breastfeeding' ? suggestedSide : tile.timer === 'pumping' ? 'both' : undefined;
      start(tile.timer, side);
    }
    navigation.navigate('Registar', { screen: tile.route, initial: false });
  };

  return (
    <View style={styles.grid}>
      {tiles.map((tile) => {
        const running = tile.timer != null && sessions[tile.timer] != null;
        const hint = tile.timer ? (running ? t('home.quickRunning') : t('home.quickStart')) : t('home.quickOpen');
        return (
          <Pressable
            key={tile.key}
            accessibilityRole="button"
            accessibilityLabel={`${tile.label}, ${hint}`}
            onPress={() => open(tile)}
            style={({ pressed }) => [styles.tile, { backgroundColor: tile.colors.bg, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name={tile.icon} size={22} color={tile.colors.ink} />
            <Text style={[styles.label, { color: tile.colors.ink }]} numberOfLines={1}>
              {tile.label}
            </Text>
            <View style={styles.hintRow}>
              {tile.timer && !running && <Ionicons name="play" size={11} color={tile.colors.ink} />}
              <Text style={[styles.hint, { color: tile.colors.ink }]}>{hint}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((colors, type) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: 88,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.inkBorder,
    padding: spacing.sm,
    gap: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontFamily: fontFamily.bodyBold, fontSize: 14 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hint: { fontFamily: fontFamily.bodyMedium, fontSize: 11.5 },
}));
