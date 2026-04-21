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
