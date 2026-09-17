import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ManualEntryToggle } from './ManualEntryToggle';

describe('ManualEntryToggle', () => {
  it('is collapsed by default and reveals the form on tap', async () => {
    const onSave = jest.fn();
    await render(<ManualEntryToggle onSave={onSave} />);

    expect(screen.queryByPlaceholderText('HH:MM')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText('Registar sessão anterior'));
    });

    expect(screen.getAllByPlaceholderText('HH:MM')).toHaveLength(2);
  });

  it('does not let Guardar be pressed with an invalid or incomplete range', async () => {
    const onSave = jest.fn();
    await render(<ManualEntryToggle onSave={onSave} />);
    await act(async () => fireEvent.press(screen.getByText('Registar sessão anterior')));

    await act(async () => {
      fireEvent.press(screen.getByText('Guardar'));
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with resolved timestamps and collapses back on a valid range', async () => {
    const onSave = jest.fn();
    await render(<ManualEntryToggle onSave={onSave} />);
    await act(async () => fireEvent.press(screen.getByText('Registar sessão anterior')));

    const [start, end] = screen.getAllByPlaceholderText('HH:MM');
    await act(async () => fireEvent.changeText(start, '13:00'));
    await act(async () => fireEvent.changeText(end, '13:45'));
    await act(async () => fireEvent.press(screen.getByText('Guardar')));

    expect(onSave).toHaveBeenCalledTimes(1);
    const [startedAt, endedAt] = onSave.mock.calls[0];
    expect(endedAt - startedAt).toBe(45 * 60 * 1000);
    expect(screen.queryByPlaceholderText('HH:MM')).toBeNull(); // collapsed after saving
  });

  it('blocks saving when extraValid is false, even with a valid time range', async () => {
    const onSave = jest.fn();
    await render(<ManualEntryToggle onSave={onSave} extraValid={false} />);
    await act(async () => fireEvent.press(screen.getByText('Registar sessão anterior')));

    const [start, end] = screen.getAllByPlaceholderText('HH:MM');
    await act(async () => fireEvent.changeText(start, '13:00'));
    await act(async () => fireEvent.changeText(end, '13:45'));
    await act(async () => fireEvent.press(screen.getByText('Guardar')));

    expect(onSave).not.toHaveBeenCalled();
  });

  describe('day picker', () => {
    const now = new Date(2026, 8, 17, 10, 0, 0).getTime(); // 2026-09-17 10:00

    beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(now));
    afterEach(() => jest.restoreAllMocks());

    it('defaults to today', async () => {
      const onSave = jest.fn();
      await render(<ManualEntryToggle onSave={onSave} />);
      await act(async () => fireEvent.press(screen.getByText('Registar sessão anterior')));

      const [start, end] = screen.getAllByPlaceholderText('HH:MM');
      await act(async () => fireEvent.changeText(start, '13:00'));
      await act(async () => fireEvent.changeText(end, '13:45'));
      await act(async () => fireEvent.press(screen.getByText('Guardar')));

      const [startedAt] = onSave.mock.calls[0];
      expect(new Date(startedAt).getDate()).toBe(17);
    });

    it('logs onto yesterday when "Ontem" is selected', async () => {
      const onSave = jest.fn();
      await render(<ManualEntryToggle onSave={onSave} />);
      await act(async () => fireEvent.press(screen.getByText('Registar sessão anterior')));
      await act(async () => fireEvent.press(screen.getByText('Ontem')));

      const [start, end] = screen.getAllByPlaceholderText('HH:MM');
      await act(async () => fireEvent.changeText(start, '13:00'));
      await act(async () => fireEvent.changeText(end, '13:45'));
      await act(async () => fireEvent.press(screen.getByText('Guardar')));

      const [startedAt] = onSave.mock.calls[0];
      expect(new Date(startedAt).getDate()).toBe(16);
    });

    it('lets a custom "DD/MM" day be picked, and blocks saving until it is valid', async () => {
      const onSave = jest.fn();
      await render(<ManualEntryToggle onSave={onSave} />);
      await act(async () => fireEvent.press(screen.getByText('Registar sessão anterior')));
      await act(async () => fireEvent.press(screen.getByText('Outro dia')));

      const [start, end] = screen.getAllByPlaceholderText('HH:MM');
      await act(async () => fireEvent.changeText(start, '13:00'));
      await act(async () => fireEvent.changeText(end, '13:45'));

      // malformed date — Guardar stays blocked
      await act(async () => fireEvent.changeText(screen.getByPlaceholderText('DD/MM'), '31/02'));
      await act(async () => fireEvent.press(screen.getByText('Guardar')));
      expect(onSave).not.toHaveBeenCalled();

      await act(async () => fireEvent.changeText(screen.getByPlaceholderText('DD/MM'), '05/09'));
      await act(async () => fireEvent.press(screen.getByText('Guardar')));

      expect(onSave).toHaveBeenCalledTimes(1);
      const [startedAt] = onSave.mock.calls[0];
      expect(new Date(startedAt).getMonth()).toBe(8); // September
      expect(new Date(startedAt).getDate()).toBe(5);
    });
  });
});
