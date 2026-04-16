import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerAllIpcHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;

const DEV_SERVER_URL = 'http://localhost:5173';

function createWindow(): void {
  const preloadPath = path.join(__dirname, '..', 'preload', 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      sandbox: true,
    },
  });

  registerAllIpcHandlers(mainWindow);

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
    mainWindow.loadFile(rendererPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
