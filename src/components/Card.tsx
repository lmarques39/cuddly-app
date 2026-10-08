import React from 'react';
import { View, ViewProps } from 'react-native';
import { radii, spacing } from '../theme/tokens';
import { createStyles } from '../theme/ThemeProvider';

export function Card({ style, ...rest }: ViewProps) {
  const styles = useStyles();
  return <View style={[styles.card, style]} {...rest} />;
}

const useStyles = createStyles((colors, type) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.inkBorder,
    padding: spacing.lg,
  },
}));
