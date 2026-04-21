"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronBridge = {
    clipboard: {
        copyPassword(password) {
            return electron_1.ipcRenderer.invoke('clipboard:copyPassword', password);
        },
    },
    autoLock: {
        onLockTriggered(callback) {
            electron_1.ipcRenderer.on('autoLock:lockTriggered', () => callback());
        },
        reportActivity() {
            electron_1.ipcRenderer.send('autoLock:reportActivity');
        },
    },
    dialog: {
        showSaveDialog(defaultName) {
            return electron_1.ipcRenderer.invoke('dialog:showSaveDialog', defaultName);
        },
        showOpenDialog(filters) {
            return electron_1.ipcRenderer.invoke('dialog:showOpenDialog', filters);
        },
    },
};
electron_1.contextBridge.exposeInMainWorld('electronBridge', electronBridge);
