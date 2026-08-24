// @ts-check
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { getTerminalSize, enterFullscreen, exitFullscreen } from './terminal.js';

describe('terminal utilities', () => {
  describe('getTerminalSize', () => {
    const originalColumns = process.stdout.columns;
    const originalRows = process.stdout.rows;

    beforeEach(() => {
      // Reset to known state
      Object.defineProperty(process.stdout, 'columns', {
        value: 80,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(process.stdout, 'rows', {
        value: 24,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // Restore original values
      if (originalColumns !== undefined) {
        Object.defineProperty(process.stdout, 'columns', {
          value: originalColumns,
          writable: true,
          configurable: true,
        });
      }
      if (originalRows !== undefined) {
        Object.defineProperty(process.stdout, 'rows', {
          value: originalRows,
          writable: true,
          configurable: true,
        });
      }
    });

    it('returns terminal dimensions', () => {
      const size = getTerminalSize();
      expect(size).toEqual({ width: 80, height: 24 });
    });

    it('returns custom dimensions when set', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 120,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(process.stdout, 'rows', {
        value: 40,
        writable: true,
        configurable: true,
      });

      const size = getTerminalSize();
      expect(size.width).toBe(120);
      expect(size.height).toBe(40);
    });

    it('returns defaults when stdout dimensions unavailable', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(process.stdout, 'rows', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const size = getTerminalSize();
      expect(size.width).toBe(80);
      expect(size.height).toBe(24);
    });

    it('returns partial defaults when only some dimensions unavailable', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 100,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(process.stdout, 'rows', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const size = getTerminalSize();
      expect(size.width).toBe(100);
      expect(size.height).toBe(24);
    });
  });

  describe('fullscreen mode', () => {
    // We can test that the functions don't throw
    // In-depth integration tests would require mocking process.stdout.write
    // and signal handlers which is complex in this environment

    it('enterFullscreen does not throw', () => {
      expect(() => {
        enterFullscreen({ hideCursor: true });
      }).not.toThrow();
    });

    it('exitFullscreen does not throw', () => {
      expect(() => {
        exitFullscreen();
      }).not.toThrow();
    });

    it('enterFullscreen can be called multiple times safely', () => {
      expect(() => {
        enterFullscreen({ hideCursor: true });
        enterFullscreen({ hideCursor: false });
        exitFullscreen();
      }).not.toThrow();
    });

    it('exitFullscreen can be called multiple times safely', () => {
      expect(() => {
        exitFullscreen();
        exitFullscreen();
      }).not.toThrow();
    });

    it('enterFullscreen and exitFullscreen balance', () => {
      expect(() => {
        enterFullscreen({ hideCursor: true });
        exitFullscreen();
        enterFullscreen({ hideCursor: false });
        exitFullscreen();
      }).not.toThrow();
    });
  });
});
