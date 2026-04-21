import { BrowserWindow, dialog, ipcMain } from 'electron';
import { registerClipboardHandlers } from './clipboard-manager';
import { registerAutoLockHandlers } from './auto-lock';

interface FileFilter {
  name: string;
  extensions: string[];
}

/**
 * Registers all IPC channel handlers.
 * Call once after the main BrowserWindow is created.
 */
export function registerAllIpcHandlers(win: BrowserWindow): void {
  // ---- Clipboard ----
  registerClipboardHandlers();

  // ---- Auto-lock ----
  registerAutoLockHandlers(win);

  // ---- File dialogs ----
  ipcMain.handle('dialog:showSaveDialog', async (_event, defaultName: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: defaultName,
    });
    return canceled ? null : filePath ?? null;
  });

  ipcMain.handle('dialog:showOpenDialog', async (_event, filters: FileFilter[]) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters,
    });
    return canceled || filePaths.length === 0 ? null : filePaths[0];
  });
}
