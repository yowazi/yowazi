// @ts-check
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { setRawMode, setNormalMode, isRawMode, getTerminalSize } from './state.js';

describe('setRawMode', () => {
  beforeEach(() => {
    // Reset state before each test
    setNormalMode();
  });

  afterEach(() => {
    // Cleanup after each test
    try {
      setNormalMode();
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('returns false when stdin is not a TTY', () => {
    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', {
      value: false,
      writable: true,
      configurable: true,
    });

    const result = setRawMode();

    expect(result).toBe(false);

    Object.defineProperty(process.stdin, 'isTTY', {
      value: originalIsTTY,
      writable: true,
      configurable: true,
    });
  });

  it('returns true when raw mode is successfully set', () => {
    if (!process.stdin.isTTY) {
      return; // Skip test if not in TTY
    }

    const result = setRawMode();
    expect(result).toBe(true);
  });

  it('returns true if raw mode is already active', () => {
    if (!process.stdin.isTTY) {
      return; // Skip test if not in TTY
    }

    setRawMode();
    const result = setRawMode();
    expect(result).toBe(true);
  });

  it('calls onResize callback on SIGWINCH', (done) => {
    if (!process.stdin.isTTY) {
      done();
      return; // Skip test if not in TTY
    }

    let resizeCalled = false;
    let receivedSize = null;

    setRawMode({
      onResize: (size) => {
        resizeCalled = true;
        receivedSize = size;
      },
    });

    // Simulate SIGWINCH
    process.emit('SIGWINCH');

    setImmediate(() => {
      expect(resizeCalled).toBe(true);
      expect(receivedSize).toHaveProperty('width');
      expect(receivedSize).toHaveProperty('height');
      setNormalMode();
      done();
    });
  });

  it('calls onSignal callback with signal name', (done) => {
    if (!process.stdin.isTTY) {
      done();
      return; // Skip test if not in TTY
    }

    let signalReceived = null;

    setRawMode({
      onSignal: (signal) => {
        signalReceived = signal;
      },
    });

    // Mock process.exit to prevent actual exit
    const originalExit = process.exit;
    process.exit = mock(() => {});

    // Simulate SIGTERM
    process.emit('SIGTERM');

    setImmediate(() => {
      expect(signalReceived).toBe('SIGTERM');
      process.exit = originalExit;
      done();
    });
  });

  it('disables capabilities when explicitly set to false', (done) => {
    if (!process.stdin.isTTY) {
      done();
      return; // Skip test if not in TTY
    }

    let stdoutWriteCalls = 0;
    const originalWrite = process.stdout.write;
    process.stdout.write = mock(() => {
      stdoutWriteCalls++;
      return true;
    });

    setRawMode({
      capabilities: {
        bracketedPaste: false,
        mouseReporting: false,
        focusEvents: false,
      },
    });

    // When all capabilities are disabled, no writes should occur
    expect(stdoutWriteCalls).toBe(0);

    setNormalMode();
    process.stdout.write = originalWrite;
    done();
  });

  it('enables capabilities by default', (done) => {
    if (!process.stdin.isTTY) {
      done();
      return; // Skip test if not in TTY
    }

    let stdoutWriteCalls = 0;
    const originalWrite = process.stdout.write;
    process.stdout.write = mock(() => {
      stdoutWriteCalls++;
      return true;
    });

    setRawMode();

    // Should enable at least bracketed paste, mouse, and focus events
    expect(stdoutWriteCalls).toBeGreaterThan(0);

    setNormalMode();
    process.stdout.write = originalWrite;
    done();
  });
});

describe('setNormalMode', () => {
  it('returns early if raw mode is not active', () => {
    // Should not throw
    expect(() => setNormalMode()).not.toThrow();
  });

  it('disables capabilities when exiting raw mode', (done) => {
    if (!process.stdin.isTTY) {
      done();
      return; // Skip test if not in TTY
    }

    let disableCalls = 0;
    const originalWrite = process.stdout.write;
    process.stdout.write = mock(() => {
      disableCalls++;
      return true;
    });

    setRawMode();
    setNormalMode();

    // Should have written disable sequences
    expect(disableCalls).toBeGreaterThan(0);

    process.stdout.write = originalWrite;
    done();
  });

  it('deregisters signal handlers', (done) => {
    if (!process.stdin.isTTY) {
      done();
      return; // Skip test if not in TTY
    }

    let signalReceived = null;

    setRawMode({
      onSignal: (signal) => {
        signalReceived = signal;
      },
    });

    setNormalMode();

    // Mock process.exit to prevent actual exit
    const originalExit = process.exit;
    process.exit = mock(() => {});

    // Emit SIGTERM after deregistering - should not be caught
    process.emit('SIGTERM');

    setImmediate(() => {
      // Signal should not have been received because handlers were removed
      expect(signalReceived).toBeNull();
      process.exit = originalExit;
      done();
    });
  });
});

describe('isRawMode', () => {
  afterEach(() => {
    try {
      setNormalMode();
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('returns false initially', () => {
    setNormalMode(); // Ensure we start clean
    expect(isRawMode()).toBe(false);
  });

  it('returns true when raw mode is active', () => {
    if (!process.stdin.isTTY) {
      return; // Skip test if not in TTY
    }

    setRawMode();
    expect(isRawMode()).toBe(true);
  });

  it('returns false after setting normal mode', () => {
    if (!process.stdin.isTTY) {
      return; // Skip test if not in TTY
    }

    setRawMode();
    setNormalMode();
    expect(isRawMode()).toBe(false);
  });
});

describe('getTerminalSize', () => {
  it('returns an object with width and height', () => {
    const size = getTerminalSize();

    expect(size).toHaveProperty('width');
    expect(size).toHaveProperty('height');
    expect(typeof size.width).toBe('number');
    expect(typeof size.height).toBe('number');
  });

  it('returns sensible defaults', () => {
    const size = getTerminalSize();

    // Most terminals are at least 80x24
    expect(size.width).toBeGreaterThanOrEqual(1);
    expect(size.height).toBeGreaterThanOrEqual(1);
  });

  it('returns actual terminal dimensions if available', () => {
    const size = getTerminalSize();

    if (process.stdout.columns && process.stdout.rows) {
      expect(size.width).toBe(process.stdout.columns);
      expect(size.height).toBe(process.stdout.rows);
    }
  });
});
