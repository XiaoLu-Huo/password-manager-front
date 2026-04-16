import { clipboard, ipcMain } from 'electron';

const CLEAR_DELAY_MS = 60_000;

let clearTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Writes `password` to the system clipboard and starts a 60-second countdown.
 * When a new request arrives the previous timer is cancelled and restarted.
 */
function copyPassword(password: string): void {
  // Cancel any pending clear
  if (clearTimer !== null) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }

  clipboard.writeText(password);

  clearTimer = setTimeout(() => {
    clipboard.clear();
    clearTimer = null;
  }, CLEAR_DELAY_MS);
}

/**
 * Registers the `clipboard:copyPassword` IPC handler.
 * Call once during app initialisation.
 */
export function registerClipboardHandlers(): void {
  ipcMain.handle('clipboard:copyPassword', (_event, password: string) => {
    copyPassword(password);
  });
}
