import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Native (Android/iOS): writes the export to the app's cache and opens the
 * system share sheet, so the user can save it to Files/Drive, email it, etc.
 * The web version lives in saveExportFile.web.ts — expo-file-system doesn't
 * run on web, and expo-sharing can't share local files there.
 */
export async function saveExportFile(fileName: string, contents: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(contents);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('A partilha de ficheiros não está disponível neste dispositivo.');
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Exportar os meus dados', UTI: 'public.json' });
}
