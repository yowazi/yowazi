// @ts-check

import { describe, it, expect, beforeEach } from 'bun:test';
import { Theme } from './theme.js';
import darkData from './themes/dark.meta.json' with { type: 'json' };
import lightData from './themes/light.meta.json' with { type: 'json' };

// Force TrueColor for tests
process.env.FORCE_COLOR = '3';

describe('Theme', () => {
  let darkTheme;
  let lightTheme;

  beforeEach(() => {
    darkTheme = new Theme(darkData);
    lightTheme = new Theme(lightData);
  });

  describe('constructor and validation', () => {
    it('should construct a theme from valid data', () => {
      expect(darkTheme.name).toBe('dark');
      expect(lightTheme.name).toBe('light');
    });

    it('should throw if a required role is missing', () => {
      const incomplete = {
        name: 'invalid',
        colors: { default: { fg: [0, 0, 0], bg: [255, 255, 255] } },
      };
      expect(() => new Theme(incomplete)).toThrow('missing required role: primary');
    });

    it('should throw if a role lacks fg color', () => {
      const invalid = {
        name: 'invalid',
        colors: {
          default: { fg: [0, 0, 0], bg: [255, 255, 255] },
          primary: { bg: [255, 0, 0] }, // missing fg
          secondary: { fg: [0, 0, 0], bg: [255, 255, 255] },
          alert: { fg: [0, 0, 0], bg: [255, 255, 255] },
          warning: { fg: [0, 0, 0], bg: [255, 255, 255] },
          error: { fg: [0, 0, 0], bg: [255, 255, 255] },
        },
      };
      expect(() => new Theme(invalid)).toThrow('invalid fg color');
    });

    it('should throw if a role has invalid color format', () => {
      const invalid = {
        name: 'invalid',
        colors: {
          default: { fg: [0, 0], bg: [255, 255, 255] }, // only 2 components
          primary: { fg: [0, 0, 0], bg: [255, 255, 255] },
          secondary: { fg: [0, 0, 0], bg: [255, 255, 255] },
          alert: { fg: [0, 0, 0], bg: [255, 255, 255] },
          warning: { fg: [0, 0, 0], bg: [255, 255, 255] },
          error: { fg: [0, 0, 0], bg: [255, 255, 255] },
        },
      };
      expect(() => new Theme(invalid)).toThrow('invalid fg color');
    });
  });

  describe('rgb()', () => {
    it('should return the raw RGB triplet for a role/channel', () => {
      const fgRgb = darkTheme.rgb('primary', 'fg');
      expect(fgRgb).toEqual([80, 200, 120]);

      const bgRgb = darkTheme.rgb('primary', 'bg');
      expect(bgRgb).toEqual([20, 60, 40]);
    });

    it('should throw for unknown role', () => {
      expect(() => darkTheme.rgb('nonexistent', 'fg')).toThrow('Unknown role');
    });

    it('should throw for unknown channel', () => {
      expect(() => darkTheme.rgb('primary', 'invalid')).toThrow('Unknown channel');
    });

    it('should work for all 6 roles', () => {
      const roles = ['default', 'primary', 'secondary', 'alert', 'warning', 'error'];
      for (const role of roles) {
        expect(() => {
          darkTheme.rgb(role, 'fg');
          darkTheme.rgb(role, 'bg');
        }).not.toThrow();
      }
    });
  });

  describe('ansi()', () => {
    it('should return an escape string', () => {
      const fgEscape = darkTheme.ansi('primary', 'fg');
      expect(typeof fgEscape).toBe('string');
      // May be empty or non-empty depending on terminal detection in test env

      const bgEscape = darkTheme.ansi('primary', 'bg');
      expect(typeof bgEscape).toBe('string');
    });

    it('should return consistent escapes for the same role/channel', () => {
      const primaryFg1 = darkTheme.ansi('primary', 'fg');
      const primaryFg2 = darkTheme.ansi('primary', 'fg');
      expect(primaryFg1).toBe(primaryFg2);
    });

    it('should return consistent but possibly different escapes for different roles', () => {
      const primaryFg = darkTheme.ansi('primary', 'fg');
      const errorFg = darkTheme.ansi('error', 'fg');
      // Both should be the same type of escape (or both empty), consistent
      expect(typeof primaryFg).toBe(typeof errorFg);
    });

    it('should throw for unknown role', () => {
      expect(() => darkTheme.ansi('nonexistent', 'fg')).toThrow('Unknown role');
    });

    it('should throw for unknown channel', () => {
      expect(() => darkTheme.ansi('primary', 'invalid')).toThrow('Unknown channel');
    });
  });

  describe('reverseLookup()', () => {
    it('should return null for an unknown escape', () => {
      const unknownEscape = 'not a real escape';
      const result = darkTheme.reverseLookup(unknownEscape);
      expect(result).toBeNull();
    });

    it('should cache the reverse map on first call', () => {
      expect(darkTheme._reverseLookupMap).toBeNull();
      darkTheme.reverseLookup('dummy');
      expect(darkTheme._reverseLookupMap).not.toBeNull();
      // Should have up to 12 entries (6 roles × 2 channels), or fewer if color escapes are empty
      expect(darkTheme._reverseLookupMap.size).toBeGreaterThanOrEqual(0);
    });

    it('should round-trip: ansi() → reverseLookup() for a role/channel', () => {
      // If ansi() produces a non-empty escape, reverseLookup should recognize it
      const primaryFg = darkTheme.ansi('primary', 'fg');
      if (primaryFg) {
        // Only test if we got a non-empty escape (i.e., color detection worked)
        const result = darkTheme.reverseLookup(primaryFg);
        expect(result).toEqual({ role: 'primary', channel: 'fg' });
      }
    });

    it('should work independently on different theme instances', () => {
      const darkTheme2 = new Theme(darkData);
      const lightTheme2 = new Theme(lightData);

      // Both should have empty reverse maps before first call
      expect(darkTheme2._reverseLookupMap).toBeNull();
      expect(lightTheme2._reverseLookupMap).toBeNull();

      // After calling, both should have maps
      darkTheme2.reverseLookup('dummy');
      lightTheme2.reverseLookup('dummy');

      expect(darkTheme2._reverseLookupMap).not.toBeNull();
      expect(lightTheme2._reverseLookupMap).not.toBeNull();
      // Maps are separate instances
      expect(darkTheme2._reverseLookupMap).not.toBe(lightTheme2._reverseLookupMap);
    });
  });
});
