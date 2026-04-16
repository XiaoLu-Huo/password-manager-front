import { contextBridge, ipcRenderer } from 'electron';

/**
 * ElectronBridge - Secure IPC interface exposed to Renderer Process.
 *
 * Only exposes clipboard, auto-lock, and dialog channels.
 * Node.js APIs and file system access are NOT exposed.
 */

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface ElectronBridge {
  clipboard: {
    copyPassword(password: string): Promise<void>;
  };
  autoLock: {
    onLockTriggered(callback: () => void): void;
    reportActivity(): void;
  };
  dialog: {
    showSaveDialog(defaultName: string): Promise<string | null>;
    showOpenDialog(filters: FileFilter[]): Promise<string | null>;
  };
}

const electronBridge: ElectronBridge = {
  clipboard: {
    copyPassword(password: string): Promise<void> {
      return ipcRenderer.invoke('clipboard:copyPassword', password);
    },
  },
  autoLock: {
    onLockTriggered(callback: () => void): void {
      ipcRenderer.on('autoLock:lockTriggered', () => callback());
    },
    reportActivity(): void {
      ipcRenderer.send('autoLock:reportActivity');
    },
  },
  dialog: {
    showSaveDialog(defaultName: string): Promise<string | null> {
      return ipcRenderer.invoke('dialog:showSaveDialog', defaultName);
    },
    showOpenDialog(filters: FileFilter[]): Promise<string | null> {
      return ipcRenderer.invoke('dialog:showOpenDialog', filters);
    },
  },
};

contextBridge.exposeInMainWorld('electronBridge', electronBridge);
