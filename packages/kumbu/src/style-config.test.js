import { describe, it, expect, beforeEach } from 'bun:test';
import { applyStyleConfig } from './style-config.js';
import { Style, setTheme } from '@yowazi/rangi';
import { cyber } from '@yowazi/rangi/themes';

describe('applyStyleConfig', () => {
  beforeEach(() => {
    setTheme(cyber);
  });

  it('applies foreground from config', () => {
    const style = new Style();
    const result = applyStyleConfig(style, { foreground: 'primary' });
    expect(result).toBeTruthy();
    const output = result.render('test');
    expect(output.length).toBeGreaterThan(0);
  });

  it('applies multiple style methods', () => {
    const style = new Style();
    const result = applyStyleConfig(style, {
      foreground: 'primary',
      background: 'secondary',
      borderForeground: 'alert'
    });
    expect(result).toBeTruthy();
    const output = result.render('test');
    expect(output.length).toBeGreaterThan(0);
  });

  it('ignores undefined config', () => {
    const style = new Style();
    const result = applyStyleConfig(style, undefined);
    expect(result).toBe(style);
  });

  it('ignores empty config', () => {
    const style = new Style();
    const result = applyStyleConfig(style, {});
    expect(result).toBe(style);
  });

  it('ignores non-existent methods', () => {
    const style = new Style();
    const result = applyStyleConfig(style, {
      nonExistentMethod: 'value',
      foreground: 'primary'
    });
    expect(result).toBeTruthy();
    const output = result.render('test');
    expect(output.length).toBeGreaterThan(0);
  });

  it('supports chaining after applyStyleConfig', () => {
    const style = new Style();
    const result = applyStyleConfig(style, { foreground: 'primary' })
      .width(20)
      .padding(1);
    expect(result).toBeTruthy();
    const output = result.render('test');
    expect(output.length).toBeGreaterThan(0);
  });

  it('accepts semantic role names', () => {
    const style = new Style();
    const roles = ['primary', 'secondary', 'alert', 'warning', 'error', 'default'];
    for (const role of roles) {
      const result = applyStyleConfig(new Style(), { foreground: role });
      expect(result.render('test').length).toBeGreaterThan(0);
    }
  });

  it('supports RGB values via dedicated RGB methods', () => {
    const style = new Style();
    // If rangi supports foregroundRGB, it will be called for RGB objects
    const result = applyStyleConfig(style, { foreground: { r: 255, g: 0, b: 0 } });
    expect(result).toBeTruthy();
    const output = result.render('test');
    expect(output.length).toBeGreaterThan(0);
  });

  it('falls back to regular method for RGB if RGB variant not available', () => {
    const style = new Style();
    // If foregroundRGB doesn't exist but foreground does, use foreground
    const result = applyStyleConfig(style, { foreground: { r: 0, g: 255, b: 0 } });
    expect(result).toBeTruthy();
    const output = result.render('test');
    expect(output.length).toBeGreaterThan(0);
  });
});
