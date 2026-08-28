// @ts-check

import { describe, it, expect } from 'bun:test';
import {
  BORDER_STYLES,
  resolveBorderChars,
  alignLine,
  normalizeBlock,
  splitLines,
  joinLines,
} from './box.js';
import { stringWidth } from '@yowazi/singi';

describe('box', () => {
  describe('BORDER_STYLES', () => {
    it('should define four standard border styles', () => {
      expect(BORDER_STYLES).toHaveProperty('normal');
      expect(BORDER_STYLES).toHaveProperty('rounded');
      expect(BORDER_STYLES).toHaveProperty('thick');
      expect(BORDER_STYLES).toHaveProperty('double');
    });

    it('each style should have 8 character keys', () => {
      const expectedKeys = [
        'top',
        'bottom',
        'left',
        'right',
        'topLeft',
        'topRight',
        'bottomLeft',
        'bottomRight',
      ];
      for (const [name, style] of Object.entries(BORDER_STYLES)) {
        for (const key of expectedKeys) {
          expect(style).toHaveProperty(key);
        }
      }
    });

    it('should be frozen', () => {
      expect(Object.isFrozen(BORDER_STYLES)).toBe(true);
    });
  });

  describe('resolveBorderChars', () => {
    it('should resolve by name', () => {
      const result = resolveBorderChars('normal');
      expect(result).toEqual(BORDER_STYLES.normal);
    });

    it('should accept custom object', () => {
      const custom = {
        top: '*',
        bottom: '*',
        left: '|',
        right: '|',
        topLeft: '+',
        topRight: '+',
        bottomLeft: '+',
        bottomRight: '+',
      };
      const result = resolveBorderChars(custom);
      expect(result).toBe(custom);
    });

    it('should throw on unknown style name', () => {
      expect(() => resolveBorderChars('unknown')).toThrow();
    });
  });

  describe('alignLine', () => {
    it('should return unchanged line when width matches', () => {
      const line = 'hello';
      expect(alignLine(line, 5, 'left')).toBe('hello');
    });

    it('should left-align by padding right', () => {
      const line = 'hi';
      const result = alignLine(line, 5, 'left');
      expect(result).toBe('hi   ');
      expect(stringWidth(result)).toBe(5);
    });

    it('should right-align by padding left', () => {
      const line = 'hi';
      const result = alignLine(line, 5, 'right');
      expect(result).toBe('   hi');
      expect(stringWidth(result)).toBe(5);
    });

    it('should center-align by splitting padding', () => {
      const line = 'hi';
      const result = alignLine(line, 5, 'center');
      expect(result).toBe(' hi  ');
      expect(stringWidth(result)).toBe(5);
    });

    it('should center-align with odd width (extra goes right)', () => {
      const line = 'x';
      const result = alignLine(line, 4, 'center');
      expect(result).toBe(' x  ');
      expect(stringWidth(result)).toBe(4);
    });

    it('should truncate using sliceWidth when wider than target', () => {
      const line = 'hello world';
      const result = alignLine(line, 5, 'left');
      expect(stringWidth(result)).toBe(5);
    });

    it('should preserve ANSI codes when truncating', () => {
      // This is a basic check; the real truncation logic is in singi's sliceWidth
      const colored = '\x1b[31mhello\x1b[39m world';
      const result = alignLine(colored, 5, 'left');
      expect(result).toContain('\x1b[');
    });

    it('should handle empty string', () => {
      const result = alignLine('', 3, 'left');
      expect(result).toBe('   ');
      expect(stringWidth(result)).toBe(3);
    });
  });

  describe('normalizeBlock', () => {
    it('should normalize a single-line block', () => {
      const block = 'hello';
      const result = normalizeBlock(block);
      expect(result.text).toBe('hello');
      expect(result.width).toBe(5);
      expect(result.height).toBe(1);
    });

    it('should normalize a multi-line block with ragged widths', () => {
      const block = 'short\nmedium text\nx';
      const result = normalizeBlock(block);
      const lines = result.text.split('\n');
      expect(lines.length).toBe(3);
      expect(stringWidth(lines[0])).toBe(11); // padded to max
      expect(stringWidth(lines[1])).toBe(11);
      expect(stringWidth(lines[2])).toBe(11);
      expect(result.width).toBe(11);
      expect(result.height).toBe(3);
    });

    it('should preserve ANSI codes during normalization', () => {
      const block = '\x1b[31mred\x1b[39m\nhello world';
      const result = normalizeBlock(block);
      const lines = result.text.split('\n');
      expect(lines[0]).toContain('\x1b[');
      expect(stringWidth(lines[0])).toBe(11); // padded
    });
  });

  describe('splitLines and joinLines', () => {
    it('should split on newlines', () => {
      const text = 'line1\nline2\nline3';
      const result = splitLines(text);
      expect(result).toEqual(['line1', 'line2', 'line3']);
    });

    it('should join with newlines', () => {
      const lines = ['a', 'b', 'c'];
      const result = joinLines(lines);
      expect(result).toBe('a\nb\nc');
    });

    it('should roundtrip', () => {
      const original = 'line1\nline2\nline3';
      const result = joinLines(splitLines(original));
      expect(result).toBe(original);
    });

    it('should handle empty array', () => {
      expect(joinLines([])).toBe('');
    });

    it('should handle empty string', () => {
      expect(splitLines('')).toEqual(['']);
    });
  });
});
