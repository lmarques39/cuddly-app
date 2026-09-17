import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { RemoveEntryButton } from './RemoveEntryButton';
import { confirmDestructive } from '../utils/confirm';

jest.mock('../utils/confirm');

const mockConfirmDestructive = confirmDestructive as jest.MockedFunction<typeof confirmDestructive>;

describe('RemoveEntryButton', () => {
  afterEach(() => {
    mockConfirmDestructive.mockReset();
  });

  it('calls onRemove only after confirming', async () => {
    const onRemove = jest.fn();
    mockConfirmDestructive.mockResolvedValue(true);

    await render(<RemoveEntryButton onRemove={onRemove} />);
    await act(async () => {
      fireEvent.press(screen.getByText('Remover'));
    });

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not call onRemove when the confirmation is cancelled', async () => {
    const onRemove = jest.fn();
    mockConfirmDestructive.mockResolvedValue(false);

    await render(<RemoveEntryButton onRemove={onRemove} />);
    await act(async () => {
      fireEvent.press(screen.getByText('Remover'));
    });

    expect(onRemove).not.toHaveBeenCalled();
  });
});
