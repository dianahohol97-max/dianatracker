/**
 * window.showSaveFilePicker is not in TypeScript's lib.dom yet (the handle
 * and writable-stream types are). Minimal declaration for the streaming zip
 * path in DownloadAllButton.
 */
interface SaveFilePickerOptions {
  suggestedName?: string
  types?: { description?: string; accept: Record<string, string[]> }[]
}

interface Window {
  showSaveFilePicker?(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>
}
