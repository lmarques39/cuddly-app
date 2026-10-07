import { auth } from '../../services/firebase';
import { readFamilyData } from '../../storage/sync';
import { familyDataToCsv } from './exportCsv';
import { saveExportFile } from './saveExportFile';

/** JSON: everything (#67). CSV: just the tracker entries, as a spreadsheet (#110). */
export type ExportFormat = 'json' | 'csv';

/** e.g. "cuddly-dados-2026-09-30.json" — local date, so it matches what the user sees on their calendar. */
export function exportFileName(now: Date, format: ExportFormat = 'json'): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `cuddly-dados-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.${format}`;
}

/**
 * Builds the export of this account's family data and hands it to the
 * platform's save/share flow. Throws if there's no signed-in user or no
 * family to export, so the screen can show an error instead of an empty file.
 */
export async function exportMyData(format: ExportFormat = 'json', now: Date = new Date()): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sem sessão iniciada.');

  const familyData = await readFamilyData();
  if (!familyData) throw new Error('Não foi encontrada nenhuma família nesta conta.');

  if (format === 'csv') {
    await saveExportFile(exportFileName(now, 'csv'), familyDataToCsv(familyData), 'csv');
    return;
  }

  const payload = {
    exportedAt: now.toISOString(),
    account: { uid: user.uid, email: user.email ?? null },
    ...familyData,
  };
  await saveExportFile(exportFileName(now), JSON.stringify(payload, null, 2), 'json');
}
