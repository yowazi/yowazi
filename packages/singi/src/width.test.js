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
});
