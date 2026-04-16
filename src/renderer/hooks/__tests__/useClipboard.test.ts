import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '../useClipboard';

describe('useClipboard', () => {
  const originalBridge = window.electronBridge;

  afterEach(() => {
    window.electronBridge = originalBridge;
    vi.restoreAllMocks();
  });

  it('calls electronBridge.clipboard.copyPassword when bridge is available', async () => {
    const mockCopy = vi.fn().mockResolvedValue(undefined);
    window.electronBridge = {
      clipboard: { copyPassword: mockCopy },
      autoLock: { onLockTriggered: vi.fn(), reportActivity: vi.fn() },
      dialog: { showSaveDialog: vi.fn(), showOpenDialog: vi.fn() },
    };

    const { result } = renderHook(() => useClipboard());
    await act(() => result.current.copyPassword('myPassword'));

    expect(mockCopy).toHaveBeenCalledWith('myPassword');
  });

  it('falls back to navigator.clipboard when bridge is unavailable', async () => {
    // Remove the bridge
    (window as any).electronBridge = undefined;

    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText },
    });

    const { result } = renderHook(() => useClipboard());
    await act(() => result.current.copyPassword('fallbackPwd'));

    expect(mockWriteText).toHaveBeenCalledWith('fallbackPwd');
  });

  it('returns a stable copyPassword reference across re-renders', () => {
    window.electronBridge = {
      clipboard: { copyPassword: vi.fn().mockResolvedValue(undefined) },
      autoLock: { onLockTriggered: vi.fn(), reportActivity: vi.fn() },
      dialog: { showSaveDialog: vi.fn(), showOpenDialog: vi.fn() },
    };

    const { result, rerender } = renderHook(() => useClipboard());
    const first = result.current.copyPassword;
    rerender();
    expect(result.current.copyPassword).toBe(first);
  });
});
