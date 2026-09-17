import { Alert, Platform } from 'react-native';

/**
 * react-native-web doesn't implement Alert.alert as a real dialog — it's a
 * silent no-op there — so every "are you sure?" flow needs a web-specific
 * path via window.confirm instead.
 */
export function confirmDestructive(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Remover', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
