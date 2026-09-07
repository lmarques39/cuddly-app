import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../theme/tokens';

type Props = { title: string; body: string };

export function PlaceholderScreen({ title, body }: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>{title}</Text>
      <Text style={type.body}>{body}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
});
