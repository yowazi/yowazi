// @ts-check
import { describe, it, expect, beforeEach } from 'bun:test';
import {
  detectColorProfile,
  downsampler,
  ColorProfile,
  fg,
  bg,
} from './color.js';

describe('color detection', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment to clean state
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    delete process.env.COLORTERM;
  });

  it('respects NO_COLOR', () => {
    process.env.NO_COLOR = '1';
    const profile = detectColorProfile(true);
    expect(profile).toBe('NoColor');
  });

  it('respects NO_COLOR even with other env vars', () => {
    process.env.NO_COLOR = '1';
    process.env.FORCE_COLOR = '3';
    const profile = detectColorProfile(true);
    expect(profile).toBe('NoColor');
  });

  it('detects FORCE_COLOR level 0 as NoColor', () => {
    process.env.FORCE_COLOR = '0';
    const profile = detectColorProfile(true);
    expect(profile).toBe('NoColor');
  });

  it('detects FORCE_COLOR level 1 as Ansi16', () => {
    process.env.FORCE_COLOR = '1';
    const profile = detectColorProfile(true);
    expect(profile).toBe('Ansi16');
  });

  it('detects FORCE_COLOR level 2 as Ansi256', () => {
    process.env.FORCE_COLOR = '2';
    const profile = detectColorProfile(true);
    expect(profile).toBe('Ansi256');
  });

  it('detects FORCE_COLOR level 3 as TrueColor', () => {
    process.env.FORCE_COLOR = '3';
    const profile = detectColorProfile(true);
    expect(profile).toBe('TrueColor');
  });

  it('treats FORCE_COLOR false string as NoColor', () => {
    process.env.FORCE_COLOR = 'false';
    const profile = detectColorProfile(true);
    expect(profile).toBe('NoColor');
  });

  it('defaults unknown FORCE_COLOR to Ansi256', () => {
    process.env.FORCE_COLOR = 'true';
    const profile = detectColorProfile(true);
    expect(profile).toBe('Ansi256');
  });

  it('uses cache on subsequent calls', () => {
    process.env.FORCE_COLOR = '1';
    const profile1 = detectColorProfile(true);

    process.env.FORCE_COLOR = '3';
    const profile2 = detectColorProfile(false); // Use cache

    expect(profile1).toBe('Ansi16');
    expect(profile2).toBe('Ansi16'); // Still returns cached value
  });

  it('forces re-detection with forceDetect flag', () => {
    process.env.FORCE_COLOR = '1';
    const profile1 = detectColorProfile(true);

    process.env.FORCE_COLOR = '3';
    const profile2 = detectColorProfile(true); // Force re-detect

    expect(profile1).toBe('Ansi16');
    expect(profile2).toBe('TrueColor');
  });
});

describe('downsampling', () => {
  it('downsample handles NoColor profile', () => {
    const downsampler_fn = downsampler('NoColor');
    expect(downsampler_fn(255, 0, 0)).toBe('');
    expect(downsampler_fn(0, 255, 0)).toBe('');
  });

  it('downsample returns string for Ansi16', () => {
    const downsampler_fn = downsampler('Ansi16');
    expect(typeof downsampler_fn(255, 0, 0)).toBe('string');
    expect(downsampler_fn(255, 0, 0).length).toBeGreaterThan(0);
  });

  it('downsample returns string for Ansi256', () => {
    const downsampler_fn = downsampler('Ansi256');
    const result = downsampler_fn(255, 0, 0);
    expect(typeof result).toBe('string');
    expect(parseInt(result)).toBeLessThanOrEqual(255);
    expect(parseInt(result)).toBeGreaterThanOrEqual(0);
  });

  it('downsample returns RGB string for TrueColor', () => {
    const downsampler_fn = downsampler('TrueColor');
    expect(downsampler_fn(255, 0, 0)).toBe('255;0;0');
    expect(downsampler_fn(100, 150, 200)).toBe('100;150;200');
  });

  it('Ansi16 brightness detection', () => {
    const downsampler_fn = downsampler('Ansi16');
    const bright = downsampler_fn(200, 200, 200); // Should be bright
    const dark = downsampler_fn(50, 50, 50); // Should be dark

    expect(bright).not.toBe(dark);
  });

  it('Ansi16 color component detection', () => {
    const downsampler_fn = downsampler('Ansi16');
    const red = downsampler_fn(255, 0, 0);
    const green = downsampler_fn(0, 255, 0);
    const blue = downsampler_fn(0, 0, 255);

    expect(red).not.toBe(green);
    expect(green).not.toBe(blue);
    expect(red).not.toBe(blue);
  });

  it('Ansi256 handles grayscale', () => {
    const downsampler_fn = downsampler('Ansi256');
    const black = downsampler_fn(0, 0, 0);
    const white = downsampler_fn(255, 255, 255);
    const gray = downsampler_fn(128, 128, 128);

    expect(black).toBe('16'); // xterm pure black
    expect(white).toBe('231'); // xterm pure white
    expect(gray).not.toBe(black);
    expect(gray).not.toBe(white);
  });

  it('Ansi256 uses 6x6x6 cube for colors', () => {
    const downsampler_fn = downsampler('Ansi256');
    const result = downsampler_fn(200, 100, 150);
    const index = parseInt(result);

    expect(index).toBeGreaterThanOrEqual(16); // Color cube starts at 16
    expect(index).toBeLessThan(232); // Grayscale starts at 232
  });
});

describe('color functions', () => {
  beforeEach(() => {
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
  });

  it('fg returns string', () => {
    const result = fg(255, 0, 0);
    expect(typeof result).toBe('string');
  });

  it('bg returns string', () => {
    const result = bg(255, 0, 0);
    expect(typeof result).toBe('string');
  });

  it('fg with NoColor returns empty string', () => {
    process.env.NO_COLOR = '1';
    detectColorProfile(true); // Force re-detection
    const result = fg(255, 0, 0);
    expect(result).toBe('');
  });

  it('bg with NoColor returns empty string', () => {
    process.env.NO_COLOR = '1';
    detectColorProfile(true); // Force re-detection
    const result = bg(255, 0, 0);
    expect(result).toBe('');
  });

  it('fg includes CSI prefix when color enabled', () => {
    process.env.FORCE_COLOR = '1';
    detectColorProfile(true); // Force re-detection
    const result = fg(255, 0, 0);
    expect(result.includes('\x1b[')).toBe(true);
    expect(result.includes('m')).toBe(true);
  });

  it('bg includes CSI prefix when color enabled', () => {
    process.env.FORCE_COLOR = '1';
    detectColorProfile(true); // Force re-detection
    const result = bg(255, 0, 0);
    expect(result.includes('\x1b[')).toBe(true);
    expect(result.includes('m')).toBe(true);
  });

  it('fg generates different codes for different colors', () => {
    process.env.FORCE_COLOR = '1';
    detectColorProfile(true); // Force re-detection
    const red = fg(255, 0, 0);
    const green = fg(0, 255, 0);
    expect(red).not.toBe(green);
  });

  it('bg generates different codes for different colors', () => {
    process.env.FORCE_COLOR = '1';
    detectColorProfile(true); // Force re-detection
    const red = bg(255, 0, 0);
    const green = bg(0, 255, 0);
    expect(red).not.toBe(green);
  });

  it('fg and bg generate different codes for same color', () => {
    process.env.FORCE_COLOR = '1';
    detectColorProfile(true); // Force re-detection
    const fgRed = fg(255, 0, 0);
    const bgRed = bg(255, 0, 0);
    expect(fgRed).not.toBe(bgRed);
  });
});
