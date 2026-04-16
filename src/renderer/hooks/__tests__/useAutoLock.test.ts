import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

// --- Mock useAuth so we don't need AuthProvider + apiClient ---
const mockLock = vi.fn();
let mockIsUnlocked = false;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    lock: mockLock,
    isUnlocked: mockIsUnlocked,
    sessionToken: mockIsUnlocked ? 'tok' : null,
    mfaRequired: false,
    unlock: vi.fn(),
    requireMfa: vi.fn(),
  }),
}));

import { useAutoLock } from '../useAutoLock';

describe('useAutoLock', () => {
  let lockCallback: (() => void) | null;
  const mockReportActivity = vi.fn();

  beforeEach(() => {
    lockCallback = null;
    mockLock.mockReset();
    mockReportActivity.mockReset();
    mockIsUnlocked = false;

    window.electronBridge = {
      clipboard: { copyPassword: vi.fn().mockResolvedValue(undefined) },
      autoLock: {
        onLockTriggered: (cb: () => void) => { lockCallback = cb; },
        reportActivity: mockReportActivity,
      },
      dialog: { showSaveDialog: vi.fn(), showOpenDialog: vi.fn() },
    };
  });

  afterEach(() => {
    // Unmount all rendered hooks to remove event listeners
    cleanup();
    vi.restoreAllMocks();
  });

  it('calls lock() when lockTriggered event fires', () => {
    renderHook(() => useAutoLock());

    expect(lockCallback).not.toBeNull();
    act(() => lockCallback!());

    expect(mockLock).toHaveBeenCalledOnce();
  });

  it('reports activity on mousemove when unlocked', () => {
    mockIsUnlocked = true;
    renderHook(() => useAutoLock());

    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });

    expect(mockReportActivity).toHaveBeenCalled();
  });

  it('reports activity on keydown when unlocked', () => {
    mockIsUnlocked = true;
    renderHook(() => useAutoLock());

    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });

    expect(mockReportActivity).toHaveBeenCalled();
  });

  it('does not register activity listeners when locked', () => {
    mockIsUnlocked = false;
    renderHook(() => useAutoLock());

    // Reset after hook setup (onLockTriggered registration may call reportActivity indirectly)
    mockReportActivity.mockClear();

    act(() => {
      window.dispatchEvent(new Event('mousemove'));
      window.dispatchEvent(new Event('keydown'));
    });

    expect(mockReportActivity).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    mockIsUnlocked = true;
    const { unmount } = renderHook(() => useAutoLock());

    unmount();
    mockReportActivity.mockClear();

    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('keydown'));

    expect(mockReportActivity).not.toHaveBeenCalled();
  });

  it('handles missing electronBridge gracefully', () => {
    (window as any).electronBridge = undefined;

    expect(() => {
      renderHook(() => useAutoLock());
    }).not.toThrow();
  });
});
