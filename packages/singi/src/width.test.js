// @ts-check
import { describe, it, expect } from 'bun:test';
import { charWidth, stringWidth, sliceWidth, padWidth, truncateWidth } from './width.js';

describe('charWidth', () => {
  it('returns 0 for control characters', () => {
    expect(charWidth('\x00')).toBe(0);
    expect(charWidth('\x1f')).toBe(0);
    expect(charWidth('\x7f')).toBe(0);
  });

  it('returns 1 for ASCII printable', () => {
    expect(charWidth('a')).toBe(1);
    expect(charWidth('A')).toBe(1);
    expect(charWidth('5')).toBe(1);
    expect(charWidth('!')).toBe(1);
    expect(charWidth(' ')).toBe(1);
  });

  it('returns 0 for combining marks', () => {
    // Combining grave accent
    expect(charWidth('̀')).toBe(0);
    // Combining acute accent
    expect(charWidth('́')).toBe(0);
  });

  it('returns 1 for most Unicode characters', () => {
    expect(charWidth('é')).toBe(1); // e + combining accent
    expect(charWidth('α')).toBe(1); // Greek alpha
    expect(charWidth('ñ')).toBe(1); // Spanish n with tilde
  });

  it('returns 2 for CJK characters', () => {
    expect(charWidth('中')).toBe(2); // Chinese
    expect(charWidth('日')).toBe(2); // Japanese Kanji
    expect(charWidth('あ')).toBe(2); // Japanese Hiragana
    expect(charWidth('カ')).toBe(2); // Japanese Katakana
    expect(charWidth('한')).toBe(2); // Korean
  });

  it('returns 2 for emoji', () => {
    expect(charWidth('😀')).toBe(2);
    expect(charWidth('👋')).toBe(2);
    expect(charWidth('🎉')).toBe(2);
    expect(charWidth('❤️')).toBe(2); // Heart emoji
  });

  it('handles extended emoji (beyond BMP)', () => {
    // Window emoji (U+1FA9F) - known problematic emoji
    expect(charWidth('🪟')).toBe(2);
  });

  it('returns 2 for fullwidth characters', () => {
    expect(charWidth('ａ')).toBe(2); // Fullwidth ASCII 'a'
    expect(charWidth('１')).toBe(2); // Fullwidth digit '1'
  });
});

describe('stringWidth', () => {
  it('calculates ASCII strings correctly', () => {
    expect(stringWidth('hello')).toBe(5);
    expect(stringWidth('Hello World')).toBe(11);
  });

  it('calculates accented characters correctly', () => {
    expect(stringWidth('café')).toBe(4);
    expect(stringWidth('naïve')).toBe(5);
  });

  it('calculates CJK strings correctly', () => {
    expect(stringWidth('中')).toBe(2);
    expect(stringWidth('中国')).toBe(4);
    expect(stringWidth('日本')).toBe(4);
    expect(stringWidth('한국')).toBe(4);
  });

  it('calculates mixed content correctly', () => {
    expect(stringWidth('Hello 世界')).toBe(10); // 5 + space(1) + 世(2) + 界(2)
    expect(stringWidth('你好world')).toBe(9); // 你(2) + 好(2) + world(5)
  });

  it('calculates emoji strings correctly', () => {
    expect(stringWidth('👋')).toBe(2);
    expect(stringWidth('👋world')).toBe(7); // 2 + 5
    expect(stringWidth('😀😀')).toBe(4);
  });

  it('calculates extended emoji correctly', () => {
    expect(stringWidth('🪟')).toBe(2); // Window emoji (U+1FA9F)
    expect(stringWidth('🪟world')).toBe(7); // 2 + 5
    expect(stringWidth('🪟🪟')).toBe(4);
  });

  it('handles empty string', () => {
    expect(stringWidth('')).toBe(0);
  });

  it('ignores combining marks in width', () => {
    // é can be one character (precomposed) or two (e + combining accent)
    const result = stringWidth('café');
    expect(result).toBeGreaterThanOrEqual(4);
    expect(result).toBeLessThanOrEqual(5);
  });

  it('strips ANSI escape codes correctly', () => {
    // Bold code
    expect(stringWidth('\x1b[1mhello\x1b[0m')).toBe(5);
    // Italic code
    expect(stringWidth('\x1b[3mworld\x1b[0m')).toBe(5);
    // RGB color code
    expect(stringWidth('\x1b[38;2;255;0;0mtest\x1b[0m')).toBe(4);
  });

  it('handles multiple ANSI codes in string', () => {
    const text = '\x1b[1m\x1b[38;2;255;200;0mCLICK ME\x1b[0m';
    expect(stringWidth(text)).toBe(8); // "CLICK ME" only
  });

  it('strips 256-color codes', () => {
    expect(stringWidth('\x1b[38;5;196mred\x1b[0m')).toBe(3);
  });

  it('strips 16-color codes', () => {
    expect(stringWidth('\x1b[31mred\x1b[0m')).toBe(3);
  });
});

describe('sliceWidth', () => {
  it('slices ASCII strings by width', () => {
    expect(sliceWidth('hello', 3)).toBe('hel');
    expect(sliceWidth('hello', 5)).toBe('hello');
    expect(sliceWidth('hello', 10)).toBe('hello');
  });

  it('slices CJK strings by width', () => {
    // Each Chinese character is 2 width
    expect(sliceWidth('你好世界', 2)).toBe('你');
    expect(sliceWidth('你好世界', 4)).toBe('你好');
    expect(sliceWidth('你好世界', 5)).toBe('你好'); // Can't fit half a character
  });

  it('slices mixed content correctly', () => {
    expect(sliceWidth('hello世', 5)).toBe('hello');
    expect(sliceWidth('hello世', 7)).toBe('hello世');
  });

  it('returns empty string for width 0', () => {
    expect(sliceWidth('hello', 0)).toBe('');
  });

  it('handles emoji in slicing', () => {
    expect(sliceWidth('👋hello', 2)).toBe('👋');
    expect(sliceWidth('👋hello', 7)).toBe('👋hello');
  });

  it('preserves ANSI codes when slicing', () => {
    const ansiStr = '\x1b[1mhello\x1b[0m';
    const sliced = sliceWidth(ansiStr, 3);
    expect(stringWidth(sliced)).toBe(3);
    expect(sliced).toContain('\x1b[1m');
    expect(sliced).toContain('\x1b[0m');
  });

  it('handles multiple ANSI codes in string', () => {
    const ansiStr = '\x1b[1m\x1b[38;2;255;200;0mCLICK ME\x1b[0m';
    const sliced = sliceWidth(ansiStr, 4);
    expect(stringWidth(sliced)).toBe(4);
    expect(sliced).toBe('\x1b[1m\x1b[38;2;255;200;0mCLIC\x1b[0m');
  });

  it('slices colored text correctly', () => {
    const coloredStr = '\x1b[31mred\x1b[0m';
    const sliced = sliceWidth(coloredStr, 2);
    expect(stringWidth(sliced)).toBe(2);
    expect(sliced).toBe('\x1b[31mre\x1b[0m');
  });
});

describe('padWidth', () => {
  it('pads right by default', () => {
    expect(padWidth('hi', 5)).toBe('   hi');
    expect(padWidth('hello', 10)).toBe('     hello');
  });

  it('pads left when specified', () => {
    expect(padWidth('hi', 5, 'left')).toBe('hi   ');
    expect(padWidth('hello', 10, 'left')).toBe('hello     ');
  });

  it('handles CJK padding', () => {
    const result = padWidth('中', 5);
    expect(stringWidth(result)).toBe(5);
  });

  it('handles emoji padding', () => {
    const result = padWidth('👋', 5);
    expect(stringWidth(result)).toBe(5);
  });

  it('returns string unchanged if already >= width', () => {
    expect(padWidth('hello', 5)).toBe('hello');
    expect(padWidth('hello', 3)).toBe('hello');
  });

  it('handles ANSI codes when padding', () => {
    const ansiStr = '\x1b[1mhi\x1b[0m';
    const padded = padWidth(ansiStr, 5);
    expect(stringWidth(padded)).toBe(5);
    expect(padded).toContain('\x1b[1m');
  });

  it('pads ANSI-colored text left', () => {
    const ansiStr = '\x1b[31mred\x1b[0m';
    const padded = padWidth(ansiStr, 6, 'left');
    expect(stringWidth(padded)).toBe(6);
  });
});

describe('truncateWidth', () => {
  it('truncates strings to fit width', () => {
    expect(truncateWidth('hello world', 8)).toBe('hello wo');
    expect(truncateWidth('hello', 5)).toBe('hello');
    expect(truncateWidth('hello', 3)).toBe('hel');
  });

  it('adds suffix when truncating', () => {
    expect(truncateWidth('hello world', 8, '…')).toBe('hello w…');
    expect(truncateWidth('hello', 4, '…')).toBe('hel…');
  });

  it('handles CJK truncation', () => {
    // 中国 is 4 width
    const result = truncateWidth('中国', 3);
    // Can only fit one character (2 width), can't fit second (would be 4 total)
    expect(stringWidth(result)).toBeLessThanOrEqual(3);
  });

  it('handles emoji truncation', () => {
    const result = truncateWidth('👋world', 5);
    expect(stringWidth(result)).toBeLessThanOrEqual(5);
  });

  it('returns original if fitting', () => {
    expect(truncateWidth('hi', 10)).toBe('hi');
    expect(truncateWidth('hello', 5)).toBe('hello');
  });

  it('truncates ANSI-encoded strings', () => {
    const ansiStr = '\x1b[1mhello world\x1b[0m';
    const truncated = truncateWidth(ansiStr, 5);
    expect(stringWidth(truncated)).toBeLessThanOrEqual(5);
    expect(truncated).toContain('\x1b[1m');
  });

  it('truncates with suffix on ANSI strings', () => {
    const ansiStr = '\x1b[31mhello world\x1b[0m';
    const truncated = truncateWidth(ansiStr, 8, '…');
    expect(stringWidth(truncated)).toBeLessThanOrEqual(8);
  });

  it('preserves ANSI codes when truncating', () => {
    const ansiStr = '\x1b[1m\x1b[38;2;255;200;0mCLICK ME\x1b[0m';
    const truncated = truncateWidth(ansiStr, 4);
    expect(stringWidth(truncated)).toBe(4);
    expect(truncated).toContain('\x1b[1m');
    expect(truncated).toContain('\x1b[38;2;255;200;0m');
  });
});

describe('charWidth - Box Drawing Characters', () => {
  it('returns 1 for common box drawing characters', () => {
    // These should all be single-width
    expect(charWidth('─')).toBe(1); // Horizontal line
    expect(charWidth('│')).toBe(1); // Vertical line
    expect(charWidth('┬')).toBe(1); // T-down
    expect(charWidth('┴')).toBe(1); // T-up
    expect(charWidth('├')).toBe(1); // T-right
    expect(charWidth('┤')).toBe(1); // T-left
    expect(charWidth('┼')).toBe(1); // Cross
    expect(charWidth('╭')).toBe(1); // Rounded corner top-left
    expect(charWidth('╮')).toBe(1); // Rounded corner top-right
    expect(charWidth('╰')).toBe(1); // Rounded corner bottom-left
    expect(charWidth('╯')).toBe(1); // Rounded corner bottom-right
  });

  it('correctly measures box drawing border width', () => {
    const border = '╭────────────────╮';
    expect(stringWidth(border)).toBe(18);
  });
});
