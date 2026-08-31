import { describe, it, expect, beforeEach } from 'bun:test';
import { TextInput } from './text-input.js';
import { setTheme } from '@yowazi/rangi';
import { cyber } from '@yowazi/rangi/themes';

describe('TextInput', () => {
  let input;

  beforeEach(() => {
    setTheme(cyber);  // Set a theme so ANSI codes are generated
    input = new TextInput({ maxLength: 10 });
  });

  it('starts with empty value', () => {
    expect(input.value).toBe('');
  });

  it('is focusable', () => {
    expect(input.isFocusable({})).toBe(true);
  });

  it('accepts printable characters', () => {
    input.handleKey({ key: 'a' }, {});
    input.handleKey({ key: 'b' }, {});
    input.handleKey({ key: 'c' }, {});
    expect(input.value).toBe('abc');
  });

  it('respects maxLength', () => {
    for (let i = 0; i < 15; i++) {
      input.handleKey({ key: 'x' }, {});
    }
    expect(input.value.length).toBe(10);
    expect(input.value).toBe('xxxxxxxxxx');
  });

  it('handles backspace', () => {
    input.value = 'hello';
    input.handleKey({ key: 'backspace' }, {});
    expect(input.value).toBe('hell');
    input.handleKey({ key: 'backspace' }, {});
    expect(input.value).toBe('hel');
  });

  it('ignores backspace on empty input', () => {
    input.handleKey({ key: 'backspace' }, {});
    expect(input.value).toBe('');
  });

  it('declines navigation keys (return null)', () => {
    const result1 = input.handleKey({ key: 'tab' }, {});
    const result2 = input.handleKey({ key: 'enter' }, {});
    const result3 = input.handleKey({ key: 'up' }, {});
    expect(result1).toBeNull();
    expect(result2).toBeNull();
    expect(result3).toBeNull();
  });

  it('provides cursor position', () => {
    input.value = 'hi';
    const pos = input.getCursorPos({});
    expect(pos.x).toBe(3); // 1 (border) + 2 (text length)
    expect(pos.y).toBe(1); // middle line of 3-line input
  });

  it('caps cursor position at maxLength', () => {
    input.value = 'x'.repeat(10); // Fill to maxLength
    const pos = input.getCursorPos({});
    expect(pos.x).toBeLessThanOrEqual(input.maxLength);
  });

  it('ignores multi-character keys', () => {
    const before = input.value;
    input.handleKey({ key: 'enter' }, {});
    input.handleKey({ key: 'shift-a' }, {});
    expect(input.value).toBe(before);
  });

  it('renders something when focused', () => {
    const output = input.render({ focusedComponent: input });
    expect(output.length).toBeGreaterThan(0);
  });

  it('renders something when unfocused', () => {
    const output = input.render({ focusedComponent: null });
    expect(output.length).toBeGreaterThan(0);
  });

  it('applies focused styling from config', () => {
    const customInput = new TextInput({
      maxLength: 10,
      focused: { foreground: 'alert', borderForeground: 'error' }
    });
    const output = customInput.render({ focusedComponent: customInput });
    expect(output.length).toBeGreaterThan(0);
  });

  it('applies unfocused styling from config', () => {
    const customInput = new TextInput({
      maxLength: 10,
      unfocused: { foreground: 'warning' }
    });
    const output = customInput.render({ focusedComponent: null });
    expect(output.length).toBeGreaterThan(0);
  });

  it('merges partial focused config with defaults', () => {
    const customInput = new TextInput({
      maxLength: 10,
      focused: { foreground: 'alert' }
    });
    // Should merge { foreground: 'alert' } with default { background: 'default', borderForeground: 'primary' }
    expect(customInput.focused).toEqual({
      foreground: 'alert',
      background: 'default',
      borderForeground: 'primary'
    });
    const output = customInput.render({ focusedComponent: customInput });
    expect(output.length).toBeGreaterThan(0);
  });

  it('merges partial unfocused config with defaults', () => {
    const customInput = new TextInput({
      maxLength: 10,
      unfocused: { foreground: 'error', background: 'alert' }
    });
    // Should merge with default { borderForeground: 'secondary' }
    expect(customInput.unfocused).toEqual({
      foreground: 'error',
      background: 'alert',
      borderForeground: 'secondary'
    });
    const output = customInput.render({ focusedComponent: null });
    expect(output.length).toBeGreaterThan(0);
  });
});
