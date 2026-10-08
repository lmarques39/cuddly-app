import i18n from '../../i18n';
import { appointmentDisplayTitle } from '../appointments/appointmentTypes';
import {
  Appointment,
  BottleEntry,
  BreastfeedingEntry,
  ContractionEntry,
  DiaperEntry,
  FoodEntry,
  PumpingEntry,
  SonoEntry,
} from '../../types/records';



type Row = { at: number; cells: [string, number, number | null, string, string] };

/** "07/10/2026 14:32", in the device's local time — what the user saw in the app. */
function formatDateTime(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Spreadsheet conventions follow the app's language (#118): Portuguese Excel
// expects ";" between columns and a decimal comma ("0,8"); English Excel
// expects "," and a decimal point ("0.8") — the other way round reads as text.
const isEnglish = () => i18n.language === 'en';
const separator = () => (isEnglish() ? ',' : ';');

/** Minutes with one decimal, in the language's decimal style. */
function formatMinutes(ms: number): string {
  const minutes = (Math.round(ms / 6000) / 10).toFixed(1);
  return isEnglish() ? minutes : minutes.replace('.', ',');
}

/** Quotes a cell only when it has to (separator, quote or line break inside). */
function escapeCell(value: string): string {
  // Only the active separator needs quoting — "0,8" is a plain number in a ";" file.
  const needsQuotes = value.includes(separator()) || /["\r\n]/.test(value);
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
}

function list<T>(data: Record<string, unknown>, key: string): T[] {
  return Array.isArray(data[key]) ? (data[key] as T[]) : [];
}

function timed(kind: string, e: { startedAt: number; endedAt: number }, detail = ''): Row {
  return { at: e.startedAt, cells: [kind, e.startedAt, e.endedAt, detail, ''] };
}

/**
 * Every tracker entry of the family as one CSV table (#110), oldest first,
 * for opening in Excel/Sheets — the JSON export (#67) stays the complete
 * one. Separator/decimals follow the language (see separator()) plus a UTF-8
 * BOM, so Excel opens it with the right columns and accents without an
 * import wizard.
 */
export function familyDataToCsv(data: Record<string, unknown>): string {
  const rows: Row[] = [
    ...list<ContractionEntry>(data, 'contractions').map((e) => timed(i18n.t('csv.kinds.contraction'), e)),
    ...list<SonoEntry>(data, 'sono').map((e) => timed(i18n.t('csv.kinds.sono'), e)),
    ...list<BreastfeedingEntry>(data, 'breastfeeding').map((e) =>
      timed(i18n.t('csv.kinds.breastfeeding'), e, i18n.t(e.side === 'right' ? 'csv.rightBreast' : 'csv.leftBreast')),
    ),
    ...list<PumpingEntry>(data, 'pumping').map((e) => timed(i18n.t('csv.kinds.pumping'), e, `${e.amountMl} ml`)),
    ...list<BottleEntry>(data, 'bottle').map((e) => ({
      at: e.at,
      cells: [i18n.t('csv.kinds.bottle'), e.at, null, `${e.amountMl} ml · ${i18n.t(`bottleTypes.${e.type}`)}`, ''] as Row['cells'],
    })),
    ...list<DiaperEntry>(data, 'diapers').map((e) => ({
      at: e.at,
      cells: [i18n.t('csv.kinds.diaper'), e.at, null, i18n.t(`diaperTypes.${e.type}`), e.note ?? ''] as Row['cells'],
    })),
    ...list<FoodEntry>(data, 'foods').map((e) => ({
      at: e.introducedAt,
      cells: [
        i18n.t('csv.kinds.food'),
        e.introducedAt,
        null,
        [e.food, e.preparation, i18n.t(`csv.reactions.${e.reaction}`)].filter(Boolean).join(' · '),
        e.reactionNotes ?? '',
      ] as Row['cells'],
    })),
    ...list<Appointment>(data, 'appointments').map((e) => ({
      at: e.scheduledAt,
      cells: [i18n.t('csv.kinds.appointment'), e.scheduledAt, null, [appointmentDisplayTitle(e), e.location].filter(Boolean).join(' · '), e.notes ?? ''] as Row['cells'],
    })),
  ];
  rows.sort((a, b) => a.at - b.at);

  const header = (['type', 'start', 'end', 'duration', 'detail', 'notes'] as const).map((k) => i18n.t(`csv.header.${k}`));
  const lines = [
    header,
    ...rows.map(({ cells: [kind, start, end, detail, notes] }) => [
      kind,
      formatDateTime(start),
      end == null ? '' : formatDateTime(end),
      end == null ? '' : formatMinutes(end - start),
      detail,
      notes,
    ]),
  ];
  return '﻿' + lines.map((cells) => cells.map(escapeCell).join(separator())).join('\r\n') + '\r\n';
}
