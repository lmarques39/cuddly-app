import {
  Appointment,
  BottleEntry,
  BottleType,
  BreastfeedingEntry,
  ContractionEntry,
  DiaperEntry,
  DiaperType,
  FoodEntry,
  FoodReaction,
  PumpingEntry,
  SonoEntry,
} from '../../types/records';

const HEADER = ['Tipo', 'Início', 'Fim', 'Duração (min)', 'Detalhe', 'Observações'];

const DIAPER_LABEL: Record<DiaperType, string> = { wet: 'Xixi', dirty: 'Cocó', both: 'Ambos' };
const REACTION_LABEL: Record<FoodReaction, string> = { nenhuma: 'Sem reação', ligeira: 'Reação ligeira', forte: 'Reação forte' };
const BOTTLE_LABEL: Record<BottleType, string> = { breastmilk: 'Leite materno', formula: 'Fórmula', mixed: 'Misto' };

type Row = { at: number; cells: [string, number, number | null, string, string] };

/** "07/10/2026 14:32", in the device's local time — what the user saw in the app. */
function formatDateTime(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Minutes with one decimal and a comma — Portuguese Excel reads "0,8" as a number, "0.8" as text. */
function formatMinutes(ms: number): string {
  return (Math.round(ms / 6000) / 10).toFixed(1).replace('.', ',');
}

/** Quotes a cell only when it has to (separator, quote or line break inside). */
function escapeCell(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
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
 * one. `;` separator and a UTF-8 BOM so Portuguese Excel opens it with the
 * right columns and accents without an import wizard.
 */
export function familyDataToCsv(data: Record<string, unknown>): string {
  const rows: Row[] = [
    ...list<ContractionEntry>(data, 'contractions').map((e) => timed('Contração', e)),
    ...list<SonoEntry>(data, 'sono').map((e) => timed('Sono', e)),
    ...list<BreastfeedingEntry>(data, 'breastfeeding').map((e) =>
      timed('Amamentação', e, e.side === 'right' ? 'Mama direita' : 'Mama esquerda'),
    ),
    ...list<PumpingEntry>(data, 'pumping').map((e) => timed('Extração', e, `${e.amountMl} ml`)),
    ...list<BottleEntry>(data, 'bottle').map((e) => ({
      at: e.at,
      cells: ['Biberão', e.at, null, `${e.amountMl} ml · ${BOTTLE_LABEL[e.type] ?? e.type}`, ''] as Row['cells'],
    })),
    ...list<DiaperEntry>(data, 'diapers').map((e) => ({
      at: e.at,
      cells: ['Fralda', e.at, null, DIAPER_LABEL[e.type] ?? e.type, e.note ?? ''] as Row['cells'],
    })),
    ...list<FoodEntry>(data, 'foods').map((e) => ({
      at: e.introducedAt,
      cells: [
        'Alimento novo',
        e.introducedAt,
        null,
        [e.food, e.preparation, REACTION_LABEL[e.reaction] ?? e.reaction].filter(Boolean).join(' · '),
        e.reactionNotes ?? '',
      ] as Row['cells'],
    })),
    ...list<Appointment>(data, 'appointments').map((e) => ({
      at: e.scheduledAt,
      cells: ['Consulta', e.scheduledAt, null, [e.title, e.location].filter(Boolean).join(' · '), e.notes ?? ''] as Row['cells'],
    })),
  ];
  rows.sort((a, b) => a.at - b.at);

  const lines = [
    HEADER,
    ...rows.map(({ cells: [kind, start, end, detail, notes] }) => [
      kind,
      formatDateTime(start),
      end == null ? '' : formatDateTime(end),
      end == null ? '' : formatMinutes(end - start),
      detail,
      notes,
    ]),
  ];
  return '﻿' + lines.map((cells) => cells.map(escapeCell).join(';')).join('\r\n') + '\r\n';
}
