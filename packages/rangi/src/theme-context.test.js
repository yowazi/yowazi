// @ts-check

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getTheme, setTheme } from './theme-context.js';
import { Theme } from './theme.js';
import darkData from './themes/dark.meta.json' with { type: 'json' };
import lightData from './themes/light.meta.json' with { type: 'json' };

// Force TrueColor for tests
process.env.FORCE_COLOR = '3';

describe('theme-context', () => {
  let originalTheme;

  beforeEach(() => {
    // Preserve the current theme so tests don't interfere with each other
    originalTheme = getTheme();
  });

  afterEach(() => {
    // Restore to dark theme (default) to avoid pollution
    setTheme(new Theme(darkData));
  });

  describe('getTheme()', () => {
    it('should return a Theme instance', () => {
      const theme = getTheme();
      expect(theme).toBeInstanceOf(Theme);
    });

    it('should return the currently set theme', () => {
      const darkTheme = new Theme(darkData);
      setTheme(darkTheme);
      expect(getTheme()).toBe(darkTheme);
    });

    it('should return dark theme by default', () => {
      // Reset to default
      setTheme(new Theme(darkData));
      const theme = getTheme();
      expect(theme.name).toBe('dark');
    });
  });

  describe('setTheme()', () => {
    it('should set the global theme', () => {
      const lightTheme = new Theme(lightData);
      setTheme(lightTheme);
      expect(getTheme()).toBe(lightTheme);
    });

    it('should throw if passed a non-Theme object', () => {
      expect(() => setTheme({ name: 'invalid' })).toThrow('Theme instance');
    });

    it('should throw if passed null', () => {
      expect(() => setTheme(null)).toThrow('Theme instance');
    });

    it('should throw if passed undefined', () => {
      expect(() => setTheme(undefined)).toThrow('Theme instance');
    });

    it('should allow switching between themes', () => {
      const darkTheme = new Theme(darkData);
      const lightTheme = new Theme(lightData);

      setTheme(darkTheme);
      expect(getTheme()).toBe(darkTheme);

      setTheme(lightTheme);
      expect(getTheme()).toBe(lightTheme);

      setTheme(darkTheme);
      expect(getTheme()).toBe(darkTheme);
    });
  });
});
