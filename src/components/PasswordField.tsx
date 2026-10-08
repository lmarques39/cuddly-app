import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { fontFamily, radii, spacing } from '../theme/tokens';
import { createStyles, useTheme } from '../theme/ThemeProvider';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

/** A password TextInput with a toggle to reveal/hide what was typed (#79). */
export function PasswordField({ value, onChangeText, placeholder }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        secureTextEntry={!visible}
        style={styles.input}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        style={styles.eyeButton}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar password' : 'Mostrar password'}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkMuted} />
      </Pressable>
    </View>
  );
}

const useStyles = createStyles((colors, type) => ({
  row: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.ink,
  },
  eyeButton: { padding: spacing.xs },
}));
