import React from 'react';
import { KeyboardAvoidingView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  /** The screen's own root style — what used to go on its SafeAreaView. */
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * Root for any screen with text fields. With edge-to-edge Android the window
 * no longer shrinks for the keyboard, so a field near the bottom (editing a
 * Extração's ml, say) ended up hidden behind it. This shrinks the screen to
 * the space above the keyboard instead, and the screen's own ScrollView or
 * FlatList then keeps the focused field in view.
 */
export function KeyboardAvoidingScreen({ style, children }: Props) {
  return (
    <KeyboardAvoidingView behavior="padding" style={styles.fill}>
      <SafeAreaView style={style} edges={['top']}>
        {children}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
