import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { RemoveEntryButton } from './RemoveEntryButton';

describe('RemoveEntryButton', () => {
  it('calls onRemove only after confirming', async () => {
    const onRemove = jest.fn();
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      buttons?.find((b) => b.text === 'Remover')?.onPress?.();
    });

    await render(<RemoveEntryButton onRemove={onRemove} />);
    await act(async () => {
      fireEvent.press(screen.getByText('Remover'));
    });

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not call onRemove when the alert is not shown to confirm', async () => {
    const onRemove = jest.fn();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {}); // user dismissed / cancelled

    await render(<RemoveEntryButton onRemove={onRemove} />);
    await act(async () => {
      fireEvent.press(screen.getByText('Remover'));
    });

    expect(onRemove).not.toHaveBeenCalled();
  });
});
