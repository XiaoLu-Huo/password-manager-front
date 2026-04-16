import { useCallback } from 'react';

/**
 * Returns a `copyPassword` function that copies the given password
 * to the system clipboard via the Electron IPC bridge.
 *
 * Falls back to the browser Clipboard API when running outside Electron
 * (e.g. during development in a regular browser).
 */
export function useClipboard(): { copyPassword: (password: string) => Promise<void> } {
  const copyPassword = useCallback(async (password: string) => {
    const bridge = window.electronBridge;
    if (bridge?.clipboard) {
      await bridge.clipboard.copyPassword(password);
    } else {
      // Fallback for non-Electron environments (dev browser)
      await navigator.clipboard.writeText(password);
    }
  }, []);

  return { copyPassword };
}
