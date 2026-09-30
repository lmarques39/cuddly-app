/** Web: a plain browser download via a Blob URL — see saveExportFile.ts for the native version. */
export async function saveExportFile(fileName: string, contents: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
