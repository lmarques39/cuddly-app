export type ContractionEntry = {
  id: string;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
};

export type SonoEntry = {
  id: string;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
};

export type PumpingEntry = {
  id: string;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  amountMl: number;
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

export type BabySex = 'menina' | 'menino' | 'prefiro_nao_dizer';

// presence of birthDate is what flips the app from Grávida to Pós-parto mode
export type BabyProfile = {
  name?: string;
  dueDate?: number; // epoch ms
  birthDate?: number; // epoch ms
  weightKg?: number;
  heightCm?: number;
  sex?: BabySex;
};

export type AppMode = 'gravida' | 'posparto';

// Local-device settings, never synced to Firestore — the actual OS-level
// notification schedule is per-device regardless, so syncing just the
// preference wouldn't buy anything. See #14's "why local, not push" note.
export type NotificationPreferences = {
  breastfeeding: { enabled: boolean; intervalHours: number };
  appointment: { enabled: boolean; daysBefore: number };
  dailySummary: { enabled: boolean; hour: number };
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  breastfeeding: { enabled: false, intervalHours: 3 },
  appointment: { enabled: false, daysBefore: 1 },
  dailySummary: { enabled: false, hour: 21 },
};

// Lives at families/{familyId}/members/{uid} — id is the doc id (== uid),
// added by subscribeToCollection, not stored as a field (unlike Invite).
export type Member = {
  id: string;
  name: string;
  role: string; // 'mae' | 'pai' | 'cuidador' (see ParentRole) — kept loose here to avoid records.ts depending on a feature module
  email: string;
};

export type InviteStatus = 'pending' | 'accepted';

// Lives at families/{familyId}/invites/{inviteId} — deliberately its own
// collection, not a member with a pending flag (see firestore.rules).
export type Invite = {
  id: string;
  email: string;
  invitedBy: string; // uid of the family member who sent it
  invitedAt: number; // epoch ms
  status: InviteStatus;
};
