export type ContractionEntry = {
  id: string;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
};

export type BreastfeedingEntry = {
  id: string;
  side: 'left' | 'right';
  startedAt: number;
  endedAt: number;
};

export type BottleType = 'breastmilk' | 'formula' | 'mixed';

export type BottleEntry = {
  id: string;
  amountMl: number;
  type: BottleType;
  at: number; // epoch ms
};

export type DiaperType = 'wet' | 'dirty' | 'both';

export type DiaperEntry = {
  id: string;
  type: DiaperType;
  at: number; // epoch ms
  note?: string;
};

export type Appointment = {
  id: string;
  title: string;
  scheduledAt: number; // epoch ms
  location?: string;
  notes?: string;
};

// presence of birthDate is what flips the app from Grávida to Pós-parto mode
export type BabyProfile = {
  name?: string;
  dueDate?: number; // epoch ms
  birthDate?: number; // epoch ms
  weightKg?: number;
  heightCm?: number;
};

export type AppMode = 'gravida' | 'posparto';
