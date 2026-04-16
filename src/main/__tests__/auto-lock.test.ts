import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mock electron ---
const mockSend = vi.fn();
const mockOn = vi.fn();

vi.mock('electron', () => ({
  ipcMain: { on: mockOn },
  BrowserWindow: vi.fn(),
}));

function createMockWindow(destroyed = false) {
  return {
    isDestroyed: vi.fn(() => destroyed),
    webContents: { send: mockSend },
  } as unknown as import('electron').BrowserWindow;
}

/** Helper: extract the handler registered for a given channel */
function getHandler(channel: string) {
  const call = mockOn.mock.calls.find((c) => c[0] === channel);
  return call ? call[1] : undefined;
}

describe('AutoLockManager', () => {
  let win: import('electron').BrowserWindow;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    mockOn.mockClear();
    mockSend.mockClear();

    win = createMockWindow();

    const mod = await import('../auto-lock');
    mod.registerAutoLockHandlers(win);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends lockTriggered after default timeout (5 min)', () => {
    vi.advanceTimersByTime(5 * 60_000);
    expect(mockSend).toHaveBeenCalledWith('autoLock:lockTriggered');
  });

  it('does not send lockTriggered before timeout', () => {
    vi.advanceTimersByTime(5 * 60_000 - 1);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('resets timer on reportActivity', () => {
    const reportActivity = getHandler('autoLock:reportActivity');

    vi.advanceTimersByTime(4 * 60_000); // 4 min in
    reportActivity();

    // 4 more minutes (8 min total, but only 4 min since activity)
    vi.advanceTimersByTime(4 * 60_000);
    expect(mockSend).not.toHaveBeenCalled();

    // 1 more minute → 5 min since last activity
    vi.advanceTimersByTime(1 * 60_000);
    expect(mockSend).toHaveBeenCalledWith('autoLock:lockTriggered');
  });

  it('allows updating timeout via autoLock:setTimeout', () => {
    const setTimeoutHandler = getHandler('autoLock:setTimeout');
    setTimeoutHandler({}, 2); // 2 minutes

    vi.advanceTimersByTime(2 * 60_000);
    expect(mockSend).toHaveBeenCalledWith('autoLock:lockTriggered');
  });

  it('rejects invalid timeout values (keeps default)', () => {
    const setTimeoutHandler = getHandler('autoLock:setTimeout');

    // 0 minutes — out of range, should keep default 5 min
    setTimeoutHandler({}, 0);
    vi.advanceTimersByTime(1 * 60_000);
    expect(mockSend).not.toHaveBeenCalled();

    // 61 minutes — also out of range
    setTimeoutHandler({}, 61);
    vi.advanceTimersByTime(4 * 60_000); // total 5 min from registration
    expect(mockSend).toHaveBeenCalledWith('autoLock:lockTriggered');
  });

  it('does not send if window is destroyed', async () => {
    // Clear any pending timers from the beforeEach registration
    vi.runAllTimers();
    mockSend.mockClear();

    vi.resetModules();
    mockOn.mockClear();

    const destroyedSend = vi.fn();
    const destroyedWin = {
      isDestroyed: vi.fn(() => true),
      webContents: { send: destroyedSend },
    } as unknown as import('electron').BrowserWindow;

    const mod = await import('../auto-lock');
    mod.registerAutoLockHandlers(destroyedWin);

    vi.advanceTimersByTime(10 * 60_000);
    expect(destroyedSend).not.toHaveBeenCalled();
  });

  it('registers expected IPC channels', () => {
    const channels = mockOn.mock.calls.map((c) => c[0]);
    expect(channels).toContain('autoLock:reportActivity');
    expect(channels).toContain('autoLock:setTimeout');
  });
});
