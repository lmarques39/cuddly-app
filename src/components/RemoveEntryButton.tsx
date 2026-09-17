import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontFamily } from '../theme/tokens';
import { confirmDestructive } from '../utils/confirm';

type Props = {
  onRemove: () => void;
};

/** Shared "Remover" link + confirmation used on every tracker's history row. */
export function RemoveEntryButton({ onRemove }: Props) {
  const confirm = async () => {
    const confirmed = await confirmDestructive(
      'Remover registo',
      'Tens a certeza que queres remover este registo?'
    );
    if (confirmed) onRemove();
  };

  return (
    <Pressable onPress={confirm} hitSlop={12}>
      <Text style={styles.label}>Remover</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: colors.coral },
});
