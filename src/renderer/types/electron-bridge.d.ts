import type { ElectronBridge } from '../../preload/preload';

declare global {
  interface Window {
    electronBridge: ElectronBridge;
  }
}

export {};
