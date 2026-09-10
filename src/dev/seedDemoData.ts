import { STORAGE_KEYS, makeId, saveList, saveObject } from '../storage/storage';
import {
  Appointment,
  BabyProfile,
  BottleEntry,
  BreastfeedingEntry,
  ContractionEntry,
  DiaperEntry,
} from '../types/records';

/**
 * Synthetic demo dataset — required by cuddly-app-directions.md ("Demo uses
 * synthetic data and does not expose real family/health information").
 * Fictional baby "Sofia", no resemblance to any real family intended.
 *
 * Only reachable from Perfil in __DEV__ builds (see PerfilScreen) — never
 * shipped as a real user-facing feature.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

function ago(ms: number): number {
  return Date.now() - ms;
}

export async function seedDemoData(): Promise<void> {
  const birthDate = ago(45 * DAY_MS);

  const babyProfile: BabyProfile = {
    name: 'Sofia',
    birthDate,
    weightKg: 4.8,
    heightCm: 55,
    sex: 'menina',
  };

  // A short labor pattern the evening before birth — demonstrates the
  // 5-1-1 detection and shows contractions stay visible in Histórico
  // even in Pós-parto mode.
  const contractionBase = birthDate - 6 * HOUR_MS;
  const contractions: ContractionEntry[] = [
    { id: makeId(), startedAt: contractionBase, endedAt: contractionBase + 65 * 1000 },
    { id: makeId(), startedAt: contractionBase + 6 * MIN_MS, endedAt: contractionBase + 6 * MIN_MS + 70 * 1000 },
    { id: makeId(), startedAt: contractionBase + 12 * MIN_MS, endedAt: contractionBase + 12 * MIN_MS + 75 * 1000 },
    { id: makeId(), startedAt: contractionBase + 18 * MIN_MS, endedAt: contractionBase + 18 * MIN_MS + 80 * 1000 },
  ].reverse();

  const breastfeeding: BreastfeedingEntry[] = [];
  const bottle: BottleEntry[] = [];
  const diapers: DiaperEntry[] = [];

  // Last 3 days of feeding/diaper activity, roughly every 3h.
  for (let day = 2; day >= 0; day--) {
    for (let feed = 0; feed < 5; feed++) {
      const at = ago(day * DAY_MS + feed * 3 * HOUR_MS + 40 * MIN_MS);
      if (feed % 2 === 0) {
        breastfeeding.push({
          id: makeId(),
          side: feed % 4 === 0 ? 'left' : 'right',
          startedAt: at,
          endedAt: at + (12 + (feed % 3) * 4) * MIN_MS,
        });
      } else {
        bottle.push({
          id: makeId(),
          amountMl: 90 + (feed % 3) * 15,
          type: feed % 3 === 0 ? 'formula' : 'breastmilk',
          at,
        });
      }
      diapers.push({
        id: makeId(),
        type: feed % 2 === 0 ? 'wet' : feed % 3 === 0 ? 'both' : 'dirty',
        at: at + 10 * MIN_MS,
      });
    }
  }

  // Every screen assumes index 0 is the most recent entry (matches
  // addToList's `[item, ...current]` prepend convention) — the loop above
  // doesn't push in strict chronological order, so sort explicitly.
  breastfeeding.sort((a, b) => b.startedAt - a.startedAt);
  bottle.sort((a, b) => b.at - a.at);
  diapers.sort((a, b) => b.at - a.at);

  const appointments: Appointment[] = [
    {
      id: makeId(),
      title: 'Consulta pós-parto',
      scheduledAt: ago(7 * DAY_MS),
      location: 'Centro de Saúde',
      notes: 'Revisão de rotina — correu bem.',
    },
    {
      id: makeId(),
      title: 'Vacina · 2 meses',
      scheduledAt: Date.now() + 14 * DAY_MS,
      location: 'Centro de Saúde',
    },
    {
      id: makeId(),
      title: 'Consulta pediatra',
      scheduledAt: Date.now() + 30 * DAY_MS,
    },
  ];

  await Promise.all([
    saveObject(STORAGE_KEYS.babyProfile, babyProfile),
    saveList(STORAGE_KEYS.contractions, contractions),
    saveList(STORAGE_KEYS.breastfeeding, breastfeeding),
    saveList(STORAGE_KEYS.bottle, bottle),
    saveList(STORAGE_KEYS.diapers, diapers),
    saveList(STORAGE_KEYS.appointments, appointments),
  ]);
}

export async function clearAllLocalData(): Promise<void> {
  await Promise.all([
    saveObject(STORAGE_KEYS.babyProfile, null),
    saveList(STORAGE_KEYS.contractions, []),
    saveList(STORAGE_KEYS.breastfeeding, []),
    saveList(STORAGE_KEYS.bottle, []),
    saveList(STORAGE_KEYS.diapers, []),
    saveList(STORAGE_KEYS.appointments, []),
  ]);
}
