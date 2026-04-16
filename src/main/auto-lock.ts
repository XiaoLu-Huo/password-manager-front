import { BrowserWindow, ipcMain } from 'electron';

const DEFAULT_TIMEOUT_MS = 5 * 60_000; // 5 minutes

let timeoutMs = DEFAULT_TIMEOUT_MS;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function resetTimer(win: BrowserWindow | null): void {
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  if (!win || win.isDestroyed()) return;

  idleTimer = setTimeout(() => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('autoLock:lockTriggered');
    }
    idleTimer = null;
  }, timeoutMs);
}

/**
 * Registers auto-lock IPC handlers and starts monitoring user activity.
 * Call once after the main BrowserWindow is created.
 */
export function registerAutoLockHandlers(win: BrowserWindow): void {
  // Renderer reports user activity (mouse / keyboard)
  ipcMain.on('autoLock:reportActivity', () => {
    resetTimer(win);
  });

  // Allow renderer to update the timeout value (in minutes)
  ipcMain.on('autoLock:setTimeout', (_event, minutes: number) => {
    if (typeof minutes === 'number' && minutes >= 1 && minutes <= 60) {
      timeoutMs = minutes * 60_000;
      resetTimer(win);
    }
  });

  // Start the initial idle timer
  resetTimer(win);
}
