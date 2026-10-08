import i18n from '../../i18n';
import { Appointment, AppointmentType } from '../../types/records';

/** Dropdown options for "Tipo de consulta", in display order — 'outra' always last. */
export const APPOINTMENT_TYPES: AppointmentType[] = [
  'obstetricia',
  'ecografia',
  'analises',
  'enfermagem',
  'pediatria',
  'vacinacao',
  'amamentacao',
  'outra',
];

export function appointmentTypeLabel(value: AppointmentType): string {
  return i18n.t(`appointments.types.${value}`);
}

/**
 * What to show for an appointment (#118): a known type is shown in the
 * current language — `title` stored the label in whatever language it was
 * booked in — and only 'outra' / pre-#82 entries fall back to the free text.
 */
export function appointmentDisplayTitle(appointment: Pick<Appointment, 'title' | 'type'>): string {
  return appointment.type && appointment.type !== 'outra' ? appointmentTypeLabel(appointment.type) : appointment.title;
}
