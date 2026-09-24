import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('hides the typed text by default and reveals it when the toggle is pressed', async () => {
    const onChangeText = jest.fn();
    await render(<PasswordField value="segredo123" onChangeText={onChangeText} />);

    expect(screen.getByDisplayValue('segredo123').props.secureTextEntry).toBe(true);

    await act(async () => {
      fireEvent.press(screen.getByRole('button'));
    });

    expect(screen.getByDisplayValue('segredo123').props.secureTextEntry).toBe(false);

    await act(async () => {
      fireEvent.press(screen.getByRole('button'));
    });

    expect(screen.getByDisplayValue('segredo123').props.secureTextEntry).toBe(true);
  });

  it('forwards typed text via onChangeText', async () => {
    const onChangeText = jest.fn();
    await render(<PasswordField value="" onChangeText={onChangeText} placeholder="Password" />);

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Password'), 'abc123');
    });

    expect(onChangeText).toHaveBeenCalledWith('abc123');
  });
});
