/** Web: a plain browser download via a Blob URL — see saveExportFile.ts for the native version. */
export async function saveExportFile(fileName: string, contents: string, format: 'json' | 'csv'): Promise<void> {
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json';
  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
