import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { InviteCaregiverForm } from './InviteCaregiverForm';

describe('InviteCaregiverForm', () => {
  it('calls onInvite with the trimmed email and shows a success message', async () => {
    const onInvite = jest.fn().mockResolvedValue(undefined);
    await render(<InviteCaregiverForm onInvite={onInvite} />);

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('cuidador@email.com'), '  bob@x.com  ');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Convidar cuidador' }));
    });

    expect(onInvite).toHaveBeenCalledWith('bob@x.com');
    expect(screen.getByText('Convite enviado.')).toBeTruthy();
  });

  it('shows an error message when onInvite rejects, and does not clear the email', async () => {
    const onInvite = jest.fn().mockRejectedValue(new Error('boom'));
    await render(<InviteCaregiverForm onInvite={onInvite} />);

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('cuidador@email.com'), 'bob@x.com');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Convidar cuidador' }));
    });

    expect(screen.getByText('Não foi possível enviar o convite. Tenta outra vez.')).toBeTruthy();
    expect(screen.getByPlaceholderText('cuidador@email.com').props.value).toBe('bob@x.com');
  });

  it('does not call onInvite when the email field is empty', async () => {
    const onInvite = jest.fn();
    await render(<InviteCaregiverForm onInvite={onInvite} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Convidar cuidador' }));
    });

    expect(onInvite).not.toHaveBeenCalled();
  });
});
