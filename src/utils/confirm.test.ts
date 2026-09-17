import { Alert, Platform } from 'react-native';
import { confirmDestructive } from './confirm';

describe('confirmDestructive', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    jest.restoreAllMocks();
    Platform.OS = originalOS;
  });

  it('uses window.confirm on web, since Alert.alert is a no-op there', async () => {
    Platform.OS = 'web';
    const windowConfirm = jest.fn().mockReturnValue(true);
    (global as { window?: { confirm: typeof windowConfirm } }).window = { confirm: windowConfirm };

    const result = await confirmDestructive('Título', 'Mensagem');

    expect(windowConfirm).toHaveBeenCalledWith('Título\n\nMensagem');
    expect(result).toBe(true);

    delete (global as { window?: unknown }).window;
  });

  it('uses Alert.alert on native and resolves true when the destructive action is pressed', async () => {
    Platform.OS = 'ios';
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      buttons?.find((b) => b.text === 'Remover')?.onPress?.();
    });

    await expect(confirmDestructive('Título', 'Mensagem')).resolves.toBe(true);
  });

  it('resolves false on native when Cancelar is pressed', async () => {
    Platform.OS = 'ios';
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      buttons?.find((b) => b.text === 'Cancelar')?.onPress?.();
    });

    await expect(confirmDestructive('Título', 'Mensagem')).resolves.toBe(false);
  });
});
