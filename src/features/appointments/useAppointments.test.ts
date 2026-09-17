import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAppointments } from './useAppointments';

describe('useAppointments', () => {
  beforeEach(() => AsyncStorage.clear());

  it('starts with an empty list', async () => {
    const { result } = await renderHook(() => useAppointments());
    await waitFor(() => expect(result.current.appointments).toEqual([]));
  });

  it('saves a new appointment with a generated id', async () => {
    const { result } = await renderHook(() => useAppointments());

    await act(async () => result.current.save({ title: 'Ecografia', scheduledAt: 1_700_000_000_000 }));

    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.appointments[0]).toMatchObject({ title: 'Ecografia', scheduledAt: 1_700_000_000_000 });
  });

  it('removes an appointment by id', async () => {
    const { result } = await renderHook(() => useAppointments());
    await act(async () => result.current.save({ title: 'Ecografia', scheduledAt: 1_700_000_000_000 }));
    const [appointment] = result.current.appointments;

    await act(async () => result.current.remove(appointment.id));

    expect(result.current.appointments).toEqual([]);
  });

  it('updates an appointment, e.g. correcting the title or rescheduling it', async () => {
    const { result } = await renderHook(() => useAppointments());
    await act(async () => result.current.save({ title: 'Ecografia', scheduledAt: 1_700_000_000_000 }));
    const [appointment] = result.current.appointments;

    await act(async () =>
      result.current.update({ ...appointment, title: 'Ecografia morfológica', scheduledAt: 1_700_100_000_000 })
    );

    expect(result.current.appointments).toEqual([
      { ...appointment, title: 'Ecografia morfológica', scheduledAt: 1_700_100_000_000 },
    ]);
  });
});
