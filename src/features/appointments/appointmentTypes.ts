import { AppointmentType } from '../../types/records';

/** Dropdown options for "Tipo de consulta", in display order — 'outra' always last. */
export const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
  { value: 'obstetricia', label: 'Obstetrícia / pré-natal' },
  { value: 'ecografia', label: 'Ecografia' },
  { value: 'analises', label: 'Análises clínicas' },
  { value: 'enfermagem', label: 'Enfermagem / saúde materna' },
  { value: 'pediatria', label: 'Pediatria' },
  { value: 'vacinacao', label: 'Vacinação' },
  { value: 'amamentacao', label: 'Amamentação / lactação' },
  { value: 'outra', label: 'Outra' },
];

export function appointmentTypeLabel(value: AppointmentType): string {
  return APPOINTMENT_TYPES.find((t) => t.value === value)?.label ?? 'Outra';
}
