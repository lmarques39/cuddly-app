import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';
import { createStyles, useTheme } from '../theme/ThemeProvider';

type Props = { title: string; body: string };

export function PlaceholderScreen({ title, body }: Props) {
  const { type } = useTheme();
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>{title}</Text>
      <Text style={type.body}>{body}</Text>
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
}));
