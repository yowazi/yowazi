// @ts-check
import { describe, it, expect } from 'bun:test';
import { detectColorProfile, downsampler } from './color.js';

describe('color detection', () => {
  it('respects NO_COLOR', () => {
    const originalEnv = process.env.NO_COLOR;
    process.env.NO_COLOR = '1';
    expect(detectColorProfile(true)).toBe('NoColor');
    delete process.env.NO_COLOR;
  });

  it('detects FORCE_COLOR', () => {
    const original = process.env.FORCE_COLOR;
    try {
      process.env.FORCE_COLOR = '1';
      const profile = detectColorProfile(true);
      expect(profile).toBe('Ansi16');
    } finally {
      if (original) {
        process.env.FORCE_COLOR = original;
      } else {
        delete process.env.FORCE_COLOR;
      }
    }
  });

  it('fetches from cache', () => {
    process.env.FORCE_COLOR = '0';
    const profile = detectColorProfile(true);
    expect(profile).toBe('NoColor');
    process.env.FORCE_COLOR = '3';
    expect(profile).toBe('NoColor');
  });

  it('downsample handles different profiles', () => {
    const noColor = downsampler('NoColor');
    expect(noColor(255, 0, 0)).toBe('');

    const ansi16 = downsampler('Ansi16');
    expect(typeof ansi16(255, 0, 0)).toBe('string');

    const ansi256 = downsampler('Ansi256');
    expect(typeof ansi256(255, 0, 0)).toBe('string');

    const trueColor = downsampler('TrueColor');
    expect(trueColor(255, 0, 0)).toBe('255;0;0');
  });
});
