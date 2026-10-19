import { useTranslation } from 'react-i18next';
import React from 'react';
import { confirmDestructive } from '../utils/confirm';
import { IconAction } from './IconAction';

type Props = {
  onRemove: () => void;
};

/** Shared "Remover" (trash icon) + confirmation used on every tracker's history row. */
export function RemoveEntryButton({ onRemove }: Props) {
  const { t } = useTranslation();
  const confirm = async () => {
    const confirmed = await confirmDestructive(
      t('removeEntry.title'),
      t('removeEntry.message')
    );
    if (confirmed) onRemove();
  };

  return <IconAction kind="remove" onPress={confirm} />;
}
