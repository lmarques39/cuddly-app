import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { AcceptInviteScreen } from './AcceptInviteScreen';

describe('AcceptInviteScreen', () => {
  it('pre-fills the name field and shows who invited', async () => {
    await render(
      <AcceptInviteScreen inviterName="Alice" defaultName="Bob" onAccept={jest.fn()} onDecline={jest.fn()} />,
    );

    expect(screen.getByText(/Alice convidou-te/)).toBeTruthy();
    expect(screen.getByPlaceholderText('Como te devemos chamar?').props.value).toBe('Bob');
  });

  it('calls onAccept with the (possibly edited) trimmed name', async () => {
    const onAccept = jest.fn().mockResolvedValue(undefined);
    await render(
      <AcceptInviteScreen inviterName={null} defaultName="" onAccept={onAccept} onDecline={jest.fn()} />,
    );

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Como te devemos chamar?'), '  Carla  ');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Aceitar convite' }));
    });

    expect(onAccept).toHaveBeenCalledWith('Carla');
  });

  it('does not call onAccept when the name field is empty', async () => {
    const onAccept = jest.fn();
    await render(<AcceptInviteScreen inviterName={null} defaultName="" onAccept={onAccept} onDecline={jest.fn()} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Aceitar convite' }));
    });

    expect(onAccept).not.toHaveBeenCalled();
  });

  it('calls onDecline when the person chooses to create their own family instead', async () => {
    const onDecline = jest.fn();
    await render(<AcceptInviteScreen inviterName={null} defaultName="Bob" onAccept={jest.fn()} onDecline={onDecline} />);

    await act(async () => {
      fireEvent.press(screen.getByText('Não, quero criar a minha própria família'));
    });

    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});
