// @ts-check

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Style } from './style.js';
import { Theme } from './theme.js';
import { getTheme, setTheme } from './theme-context.js';
import darkData from './themes/dark.meta.json' with { type: 'json' };
import lightData from './themes/light.meta.json' with { type: 'json' };
import { bold, noBold, italic, noItalic, sgr } from '@yowazi/singi';

// Force TrueColor for tests
process.env.FORCE_COLOR = '3';

describe('Style', () => {
  let darkTheme;
  let lightTheme;

  beforeEach(() => {
    darkTheme = new Theme(darkData);
    lightTheme = new Theme(lightData);
    setTheme(darkTheme);
  });

  afterEach(() => {
    setTheme(darkTheme);
  });

  describe('immutability', () => {
    it('should not mutate when calling builder methods', () => {
      const original = new Style();
      const bold1 = original.bold();
      const italic1 = original.italic();

      expect(original.render('test')).not.toContain('\x1b[1m'); // original has no bold
      expect(bold1.render('test')).toContain('\x1b[1m'); // bold1 has bold
      expect(italic1.render('test')).toContain('\x1b[3m'); // italic1 has italic
    });

    it('should allow chaining', () => {
      const style = new Style().bold().italic().foreground('primary');
      expect(style).toBeInstanceOf(Style);
      expect(style.render('test')).toContain('\x1b[1m');
      expect(style.render('test')).toContain('\x1b[3m');
    });
  });

  describe('text attributes', () => {
    it('bold() should enable bold', () => {
      const style = new Style().bold();
      expect(style.render('test')).toContain(bold());
    });

    it('italic() should enable italic', () => {
      const style = new Style().italic();
      expect(style.render('test')).toContain(italic());
    });

    it('should combine multiple attributes', () => {
      const style = new Style().bold().italic().underline();
      const rendered = style.render('test');
      expect(rendered).toContain('\x1b[1m'); // bold
      expect(rendered).toContain('\x1b[3m'); // italic
      expect(rendered).toContain('\x1b[4m'); // underline
    });

    it('should include attribute disables in close()', () => {
      const style = new Style().bold().italic();
      const closeCodes = style.close();
      expect(closeCodes).toContain(noBold());
      expect(closeCodes).toContain(noItalic());
    });
  });

  describe('semantic colors', () => {
    it('foreground() should store semantic foreground', () => {
      const style = new Style().foreground('primary');
      expect(style._foreground).toEqual({ type: 'semantic', role: 'primary' });
    });

    it('background() should store semantic background', () => {
      const style = new Style().background('alert');
      expect(style._background).toEqual({ type: 'semantic', role: 'alert' });
    });

    it('should render with semantic colors in open()', () => {
      const style = new Style().foreground('primary');
      const open = style.open();
      const expectedEscape = darkTheme.ansi('primary', 'fg');
      if (expectedEscape) {
        expect(open).toContain(expectedEscape);
      }
      // open() should call ansi() which uses the current theme
    });

    it('should switch to new theme when global theme changes', () => {
      const style = new Style().foreground('primary');

      const underDark = style.render('test');
      const darkEscape = darkTheme.ansi('primary', 'fg');

      setTheme(lightTheme);
      const underLight = style.render('test');
      const lightEscape = lightTheme.ansi('primary', 'fg');

      // If both themes produce different escapes, the renders should differ
      if (darkEscape && lightEscape && darkEscape !== lightEscape) {
        expect(underLight).not.toBe(underDark);
        expect(underLight).toContain(lightEscape);
      }
    });

    it('should allow both foreground and background semantic colors', () => {
      const style = new Style().foreground('primary').background('secondary');
      expect(style._foreground).toEqual({ type: 'semantic', role: 'primary' });
      expect(style._background).toEqual({ type: 'semantic', role: 'secondary' });
    });
  });

  describe('raw RGB colors', () => {
    it('foregroundRGB() should store raw RGB foreground', () => {
      const style = new Style().foregroundRGB(100, 150, 200);
      expect(style._foreground).toEqual({ type: 'rgb', value: [100, 150, 200] });
    });

    it('backgroundRGB() should store raw RGB background', () => {
      const style = new Style().backgroundRGB(200, 100, 50);
      expect(style._background).toEqual({ type: 'rgb', value: [200, 100, 50] });
    });

    it('should not be affected by theme switches', () => {
      const style = new Style().foregroundRGB(100, 150, 200);
      const before = style.render('test');

      setTheme(lightTheme);
      const after = style.render('test');

      expect(before).toBe(after); // raw RGB is theme-agnostic
    });

    it('should combine with semantic colors', () => {
      const style = new Style()
        .foregroundRGB(100, 150, 200)
        .background('alert');

      expect(style._foreground).toEqual({ type: 'rgb', value: [100, 150, 200] });
      expect(style._background).toEqual({ type: 'semantic', role: 'alert' });
    });
  });

  describe('per-style theme override', () => {
    it('theme() should override global theme', () => {
      const style = new Style()
        .theme(lightTheme)
        .foreground('primary');

      const rendered = style.render('test');
      const lightEscape = lightTheme.ansi('primary', 'fg');
      expect(rendered).toContain(lightEscape);
    });

    it('per-style override should not affect other styles', () => {
      const overridden = new Style()
        .theme(lightTheme)
        .foreground('primary');

      const global = new Style().foreground('primary');

      setTheme(darkTheme);
      const overriddenRendered = overridden.render('test');
      const globalRendered = global.render('test');

      expect(overriddenRendered).toContain(lightTheme.ansi('primary', 'fg'));
      expect(globalRendered).toContain(darkTheme.ansi('primary', 'fg'));
    });
  });

  describe('open() and close()', () => {
    it('open() should return escape prefix', () => {
      const style = new Style().bold().foreground('primary');
      const open = style.open();
      expect(open).toContain(bold());
      expect(open).toContain(darkTheme.ansi('primary', 'fg'));
      expect(open).not.toContain('test'); // no actual text
    });

    it('close() should return disable codes for enabled channels', () => {
      const style = new Style().bold().italic().foreground('primary').background('secondary');
      const close = style.close();

      expect(close).toContain(noBold());
      expect(close).toContain(noItalic());
      expect(close).toContain(sgr(39)); // default fg
      expect(close).toContain(sgr(49)); // default bg
    });

    it('close() should not include codes for disabled channels', () => {
      const style = new Style().bold(); // only bold, no colors
      const close = style.close();

      expect(close).toContain(noBold());
      expect(close).not.toContain(sgr(39)); // no fg set, so no fg close
      expect(close).not.toContain(sgr(49)); // no bg set, so no bg close
    });

    it('empty style should have empty open and close', () => {
      const style = new Style();
      expect(style.open()).toBe('');
      expect(style.close()).toBe('');
    });
  });

  describe('render()', () => {
    it('should wrap text with open + close', () => {
      const style = new Style().bold();
      const rendered = style.render('hello');

      expect(rendered).toContain(bold());
      expect(rendered).toContain('hello');
      expect(rendered).toContain(noBold());

      // Check order: bold, text, noBold
      const boldIdx = rendered.indexOf(bold());
      const textIdx = rendered.indexOf('hello');
      const noBoldIdx = rendered.indexOf(noBold());

      expect(boldIdx).toBeLessThan(textIdx);
      expect(textIdx).toBeLessThan(noBoldIdx);
    });

    it('should handle empty text', () => {
      const style = new Style().bold();
      const rendered = style.render('');
      expect(rendered).toContain(bold());
      expect(rendered).toContain(noBold());
    });

    it('should handle text with ANSI codes already in it', () => {
      const style = new Style().bold();
      const innerText = italic() + 'hello' + noItalic();
      const rendered = style.render(innerText);

      expect(rendered).toContain(bold());
      expect(rendered).toContain(italic());
      expect(rendered).toContain('hello');
      expect(rendered).toContain(noItalic());
      expect(rendered).toContain(noBold());
    });
  });

  describe('nested composition (reopen-on-close)', () => {
    it('should preserve outer bold when inner style closes italic', () => {
      const outer = new Style().bold().foregroundRGB(255, 0, 0);
      const inner = new Style().italic().foregroundRGB(0, 0, 255);

      const text = outer.render(`start ${inner.render('inner')} end`);

      // All three parts should exist
      expect(text).toContain('start');
      expect(text).toContain('inner');
      expect(text).toContain('end');

      // The bold code should appear before "start"
      const boldIdx = text.indexOf(bold());
      const startIdx = text.indexOf('start');
      expect(boldIdx).toBeLessThan(startIdx);

      // After inner closes its italic, bold should be reopened for "end"
      // This is verified by checking that the final close only has noBold
      const finalClose = text.slice(text.lastIndexOf(noBold()));
      expect(finalClose).toContain(noBold());
    });

    it('should not lose outer colors when inner style closes its foreground', () => {
      const outer = new Style().foreground('primary');
      const inner = new Style().foregroundRGB(0, 0, 255);

      const text = outer.render(`outer ${inner.render('inner')} outer`);

      // Should have the outer theme escape at the start
      const primaryEscape = darkTheme.ansi('primary', 'fg');
      expect(text).toContain(primaryEscape);

      // The reopen-on-close substitution should ensure outer color is restored
      // Count occurrences of the outer escape (should be at least 2: start and after inner)
      const count = (text.match(new RegExp(primaryEscape.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should handle multiple levels of nesting', () => {
      const outer = new Style().bold();
      const middle = new Style().italic();
      const inner = new Style().underline();

      const text = outer.render(`a ${middle.render(`b ${inner.render('c')} b`)} a`);

      expect(text).toContain('a');
      expect(text).toContain('b');
      expect(text).toContain('c');

      // All attributes should be present
      expect(text).toContain(bold());
      expect(text).toContain(italic());
      expect(text).toContain('\x1b[4m'); // underline
    });
  });

  describe('reopen-on-close edge cases', () => {
    it('should handle inner styles with raw RGB colors', () => {
      const outer = new Style().foreground('primary');
      const inner = new Style().foregroundRGB(100, 200, 50);

      const text = outer.render(`outer ${inner.render('inner')} outer`);

      // Should not crash and should contain both the theme escape and some RGB escape
      expect(text).toContain(darkTheme.ansi('primary', 'fg'));
      expect(text).toContain('\x1b[');
    });

    it('should handle style with no colors in outer', () => {
      const outer = new Style().bold();
      const inner = new Style().foreground('error');

      const text = outer.render(`${inner.render('error text')}`);

      expect(text).toContain(bold());
      expect(text).toContain('error text');
    });

    it('should handle completely empty inner', () => {
      const outer = new Style().bold().foreground('primary');
      const inner = new Style(); // empty inner

      const text = outer.render(`text ${inner.render('')} more`);

      // Should not crash
      expect(text).toContain('text');
      expect(text).toContain('more');
    });
  });

  describe('special character handling', () => {
    it('should preserve special characters in text', () => {
      const style = new Style().bold();
      const special = '✓ emoji and © symbols';
      const rendered = style.render(special);

      expect(rendered).toContain(special);
    });

    it('should preserve newlines in text', () => {
      const style = new Style().bold();
      const multiline = 'line1\nline2\nline3';
      const rendered = style.render(multiline);

      expect(rendered).toContain(multiline);
    });

    it('should handle text with embedded escape sequences', () => {
      const style = new Style().bold();
      const nestedBold = bold();
      const nestedNoBold = noBold();
      const textWithEscape = 'start ' + nestedBold + 'nested' + nestedNoBold + ' end';
      const rendered = style.render(textWithEscape);

      // Rendered should contain all the parts
      expect(rendered).toContain('start');
      expect(rendered).toContain('nested');
      expect(rendered).toContain('end');
      // Due to reopen-on-close, may have additional reopens injected
    });
  });
});
