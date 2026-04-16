import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mock electron before importing the module under test ---
const mockWriteText = vi.fn();
const mockClear = vi.fn();
const mockHandle = vi.fn();

vi.mock('electron', () => ({
  clipboard: { writeText: mockWriteText, clear: mockClear },
  ipcMain: { handle: mockHandle },
}));

// Dynamic import so the mock is in place first
let registerClipboardHandlers: typeof import('../clipboard-manager').registerClipboardHandlers;

describe('ClipboardManager', () => {
  let handler: (_event: unknown, password: string) => void;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    mockHandle.mockReset();
    mockWriteText.mockReset();
    mockClear.mockReset();

    // Re-import to get a fresh module (resets internal clearTimer)
    const mod = await import('../clipboard-manager');
    registerClipboardHandlers = mod.registerClipboardHandlers;
    registerClipboardHandlers();

    // Extract the handler registered via ipcMain.handle
    handler = mockHandle.mock.calls[0][1];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes password to system clipboard', () => {
    handler({}, 'secret123');
    expect(mockWriteText).toHaveBeenCalledWith('secret123');
  });

  it('clears clipboard after 60 seconds', () => {
    handler({}, 'secret123');

    vi.advanceTimersByTime(59_999);
    expect(mockClear).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockClear).toHaveBeenCalledOnce();
  });

  it('resets timer when a new copy request arrives', () => {
    handler({}, 'first');

    // Advance 30 seconds, then copy again
    vi.advanceTimersByTime(30_000);
    handler({}, 'second');

    // 30 more seconds (60s from first, but only 30s from second)
    vi.advanceTimersByTime(30_000);
    expect(mockClear).not.toHaveBeenCalled();

    // Complete the remaining 30 seconds for the second request
    vi.advanceTimersByTime(30_000);
    expect(mockClear).toHaveBeenCalledOnce();
  });

  it('writes the latest password when multiple requests arrive', () => {
    handler({}, 'first');
    handler({}, 'second');
    handler({}, 'third');

    expect(mockWriteText).toHaveBeenCalledTimes(3);
    expect(mockWriteText).toHaveBeenLastCalledWith('third');
  });

  it('registers on the clipboard:copyPassword channel', () => {
    expect(mockHandle.mock.calls[0][0]).toBe('clipboard:copyPassword');
  });
});
