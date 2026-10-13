import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { fontFamily } from '../theme/tokens';
import { createStyles } from '../theme/ThemeProvider';
import { SessionTimesForm } from './SessionTimesForm';

type Props = {
  /** Called with the resolved timestamps once "Guardar" is pressed on a valid range. */
  onSave: (startedAt: number, endedAt: number) => void;
  /** Extra fields a specific tracker needs (e.g. side, ml) shown inside the form. */
  extraFields?: React.ReactNode;
  /** Set to false to block saving until the extra fields are also filled in. */
  extraValid?: boolean;
};

/**
 * Lets a session be logged after the fact (e.g. the baby fell asleep and the
 * parents only noticed later, so the live timer was never started), on a
 * day the person picks (#76). Collapsed to a link until tapped.
 */
export function ManualEntryToggle({ onSave, extraFields, extraValid = true }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} hitSlop={8}>
        <Text style={styles.toggleLabel}>{t('manualEntry.toggle')}</Text>
      </Pressable>
    );
  }

  return (
    <SessionTimesForm
      heading={t('manualEntry.heading')}
      onSave={(startedAt, endedAt) => {
        onSave(startedAt, endedAt);
        setOpen(false);
      }}
      onCancel={() => setOpen(false)}
      extraFields={extraFields}
      extraValid={extraValid}
    />
  );
}

const useStyles = createStyles((colors, type) => ({
  toggleLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.primary },
}));
