import { describe, it, expect } from 'bun:test';
import { inputDefaults, mergeStyleDefaults } from './style-defaults.js';

describe('inputDefaults', () => {
  it('provides focused defaults', () => {
    expect(inputDefaults.focused).toEqual({
      foreground: 'primary',
      background: 'default',
      borderForeground: 'primary'
    });
  });

  it('provides unfocused defaults', () => {
    expect(inputDefaults.unfocused).toEqual({
      foreground: 'secondary',
      background: 'default',
      borderForeground: 'secondary'
    });
  });
});

describe('mergeStyleDefaults', () => {
  it('returns defaults when no user config provided', () => {
    const result = mergeStyleDefaults(inputDefaults);
    expect(result).toEqual(inputDefaults);
  });

  it('merges partial focused config', () => {
    const result = mergeStyleDefaults(inputDefaults, {
      focused: { foreground: 'alert' }
    });
    expect(result.focused).toEqual({
      foreground: 'alert',
      background: 'default',
      borderForeground: 'primary'
    });
    expect(result.unfocused).toEqual(inputDefaults.unfocused);
  });

  it('merges partial unfocused config', () => {
    const result = mergeStyleDefaults(inputDefaults, {
      unfocused: { foreground: 'error', background: 'alert' }
    });
    expect(result.unfocused).toEqual({
      foreground: 'error',
      background: 'alert',
      borderForeground: 'secondary'
    });
    expect(result.focused).toEqual(inputDefaults.focused);
  });

  it('merges both focused and unfocused overrides', () => {
    const result = mergeStyleDefaults(inputDefaults, {
      focused: { foreground: 'warning' },
      unfocused: { foreground: 'error' }
    });
    expect(result.focused.foreground).toBe('warning');
    expect(result.focused.background).toBe('default');
    expect(result.unfocused.foreground).toBe('error');
    expect(result.unfocused.background).toBe('default');
  });

  it('handles RGB values in override', () => {
    const result = mergeStyleDefaults(inputDefaults, {
      focused: { foreground: { r: 255, g: 0, b: 0 } }
    });
    expect(result.focused.foreground).toEqual({ r: 255, g: 0, b: 0 });
    expect(result.focused.background).toBe('default');
  });

  it('allows complete override of focused', () => {
    const customFocused = {
      foreground: 'custom1',
      background: 'custom2',
      borderForeground: 'custom3'
    };
    const result = mergeStyleDefaults(inputDefaults, {
      focused: customFocused
    });
    expect(result.focused).toEqual(customFocused);
  });

  it('handles empty override', () => {
    const result = mergeStyleDefaults(inputDefaults, {});
    expect(result).toEqual(inputDefaults);
  });
});
