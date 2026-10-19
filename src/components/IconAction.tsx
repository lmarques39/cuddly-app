import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props = {
  kind: 'edit' | 'remove';
  onPress: () => void;
};

const ICON = { edit: 'pencil-outline', remove: 'trash-outline' } as const;
const LABEL = { edit: 'common.edit', remove: 'common.remove' } as const;

/**
 * Pencil / trash icon in place of the old "Editar" / "Remover" text links.
 * The word stays as the accessibility label, so screen readers still say it.
 */
export function IconAction({ kind, onPress }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel={t(LABEL[kind])}>
      <Ionicons name={ICON[kind]} size={20} color={kind === 'remove' ? colors.coral : colors.primary} />
    </Pressable>
  );
}
