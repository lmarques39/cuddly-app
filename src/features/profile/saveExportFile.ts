import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Native (Android/iOS): writes the export to the app's cache and opens the
 * system share sheet, so the user can save it to Files/Drive, email it, etc.
 * The web version lives in saveExportFile.web.ts — expo-file-system doesn't
 * run on web, and expo-sharing can't share local files there.
 */
const FILE_TYPE = {
  json: { mimeType: 'application/json', UTI: 'public.json' },
  csv: { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' },
} as const;

export async function saveExportFile(fileName: string, contents: string, format: keyof typeof FILE_TYPE): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(contents);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('A partilha de ficheiros não está disponível neste dispositivo.');
  }
  await Sharing.shareAsync(file.uri, { ...FILE_TYPE[format], dialogTitle: 'Exportar os meus dados' });
}
