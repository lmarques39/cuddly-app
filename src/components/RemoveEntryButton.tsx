import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { fontFamily } from '../theme/tokens';
import { createStyles } from '../theme/ThemeProvider';
import { confirmDestructive } from '../utils/confirm';

type Props = {
  onRemove: () => void;
};

/** Shared "Remover" link + confirmation used on every tracker's history row. */
export function RemoveEntryButton({ onRemove }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();
  const confirm = async () => {
    const confirmed = await confirmDestructive(
      t('removeEntry.title'),
      t('removeEntry.message')
    );
    if (confirmed) onRemove();
  };

  return (
    <Pressable onPress={confirm} hitSlop={12}>
      <Text style={styles.label}>{t('common.remove')}</Text>
    </Pressable>
  );
}

const useStyles = createStyles((colors, type) => ({
  label: { fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: colors.coral },
}));
