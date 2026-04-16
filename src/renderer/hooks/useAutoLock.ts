import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Listens for the `autoLock:lockTriggered` event from the main process
 * and clears auth state + navigates to the unlock page.
 *
 * Also reports user activity (mouse / keyboard) so the idle timer resets.
 */
export function useAutoLock(): void {
  const { lock, isUnlocked } = useAuth();

  // Listen for lock event from main process
  useEffect(() => {
    const bridge = window.electronBridge;
    if (!bridge?.autoLock) return;

    bridge.autoLock.onLockTriggered(() => {
      lock();
    });
  }, [lock]);

  // Report user activity to main process so idle timer resets
  useEffect(() => {
    if (!isUnlocked) return;

    const bridge = window.electronBridge;
    if (!bridge?.autoLock) return;

    const report = () => bridge.autoLock.reportActivity();

    window.addEventListener('mousemove', report);
    window.addEventListener('keydown', report);

    return () => {
      window.removeEventListener('mousemove', report);
      window.removeEventListener('keydown', report);
    };
  }, [isUnlocked]);
}
