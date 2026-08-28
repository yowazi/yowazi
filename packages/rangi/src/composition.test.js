// @ts-check

import { describe, it, expect } from 'bun:test';
import { joinVertical, joinHorizontal } from './composition.js';
import { stringWidth } from '@yowazi/singi';

describe('composition', () => {
  describe('joinVertical', () => {
    it('should stack blocks vertically', () => {
      const block1 = 'hello';
      const block2 = 'world';
      const result = joinVertical('left', block1, block2);
      expect(result).toBe('hello\nworld');
    });

    it('should align lines to max width', () => {
      const block1 = 'short';
      const block2 = 'this is much longer';
      const result = joinVertical('left', block1, block2);
      const lines = result.split('\n');
      expect(stringWidth(lines[0])).toBe(stringWidth(lines[1]));
    });

    it('should left-align (pad right)', () => {
      const block1 = 'a';
      const block2 = 'bc';
      const result = joinVertical('left', block1, block2);
      const lines = result.split('\n');
      expect(lines[0]).toBe('a ');
      expect(lines[1]).toBe('bc');
    });

    it('should right-align (pad left)', () => {
      const block1 = 'a';
      const block2 = 'bc';
      const result = joinVertical('right', block1, block2);
      const lines = result.split('\n');
      expect(lines[0]).toBe(' a');
      expect(lines[1]).toBe('bc');
    });

    it('should center-align', () => {
      const block1 = 'a';
      const block2 = 'bc';
      const result = joinVertical('center', block1, block2);
      const lines = result.split('\n');
      expect(lines[0]).toBe('a '); // centered, extra goes right
      expect(lines[1]).toBe('bc');
    });

    it('should handle multi-line blocks', () => {
      const block1 = 'line1\nline2';
      const block2 = 'x';
      const result = joinVertical('left', block1, block2);
      const lines = result.split('\n');
      expect(lines.length).toBe(3);
    });

    it('should preserve ANSI codes', () => {
      const block1 = '\x1b[31mred\x1b[39m';
      const block2 = 'plain';
      const result = joinVertical('left', block1, block2);
      expect(result).toContain('\x1b[31m');
    });

    it('should throw on empty blocks', () => {
      expect(() => joinVertical('left')).toThrow();
    });

    it('should throw on invalid alignment', () => {
      expect(() => joinVertical('invalid', 'block')).toThrow();
    });
  });

  describe('joinHorizontal', () => {
    it('should place blocks side-by-side', () => {
      const block1 = 'a';
      const block2 = 'b';
      const result = joinHorizontal('top', block1, block2);
      expect(result).toBe('ab');
    });

    it('should align blocks to max height', () => {
      const block1 = 'line1\nline2\nline3';
      const block2 = 'x';
      const result = joinHorizontal('top', block1, block2);
      const lines = result.split('\n');
      expect(lines.length).toBe(3);
    });

    it('should top-align (add blanks at bottom)', () => {
      const block1 = 'a\nb\nc';
      const block2 = 'x';
      const result = joinHorizontal('top', block1, block2);
      const lines = result.split('\n');
      // block2 is single line, should have blanks added at bottom
      expect(lines[0]).toBe('ax');
      expect(lines[1]).toBe('b ');
      expect(lines[2]).toBe('c ');
    });

    it('should bottom-align (add blanks at top)', () => {
      const block1 = 'a\nb\nc';
      const block2 = 'x';
      const result = joinHorizontal('bottom', block1, block2);
      const lines = result.split('\n');
      // block2 is single line, should have blanks added at top
      expect(lines[0]).toBe('a ');
      expect(lines[1]).toBe('b ');
      expect(lines[2]).toBe('cx');
    });

    it('should center-align (split blanks)', () => {
      const block1 = 'a\nb\nc';
      const block2 = 'x';
      const result = joinHorizontal('center', block1, block2);
      const lines = result.split('\n');
      // block2 is single line, should have blanks split top/bottom
      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('a ');
      expect(lines[1]).toBe('bx');
      expect(lines[2]).toBe('c ');
    });

    it('should preserve ANSI codes in each block', () => {
      const block1 = '\x1b[31mred\x1b[39m';
      const block2 = '\x1b[32mgreen\x1b[39m';
      const result = joinHorizontal('top', block1, block2);
      expect(result).toContain('\x1b[31m');
      expect(result).toContain('\x1b[32m');
    });

    it('should handle multi-line ANSI blocks correctly', () => {
      const block1 = '\x1b[31mline1\x1b[39m\n\x1b[31mline2\x1b[39m';
      const block2 = 'a';
      const result = joinHorizontal('top', block1, block2);
      const lines = result.split('\n');
      expect(lines.length).toBe(2);
      expect(lines[0]).toContain('\x1b[31m');
    });

    it('should normalize each block internally (handle ragged widths)', () => {
      const block1 = 'short\nmedium\nlonger line';
      const block2 = 'x';
      const result = joinHorizontal('top', block1, block2);
      const lines = result.split('\n');
      // Each line should be consistent length internally
      expect(lines.length).toBe(3);
    });

    it('should throw on empty blocks', () => {
      expect(() => joinHorizontal('top')).toThrow();
    });

    it('should throw on invalid alignment', () => {
      expect(() => joinHorizontal('invalid', 'block')).toThrow();
    });
  });

  describe('composition roundtrip', () => {
    it('should compose two bordered boxes horizontally', () => {
      // This tests the real use case: joining two pre-rendered styled blocks
      const box1 = '┌─┐\n│a│\n└─┘';
      const box2 = '┌─┐\n│b│\n└─┘';
      const result = joinHorizontal('top', box1, box2);
      const lines = result.split('\n');
      expect(lines.length).toBe(3);
      expect(lines[0]).toContain('┌');
    });

    it('should compose blocks vertically then horizontally', () => {
      const top = joinVertical('center', 'title');
      const bottom = joinHorizontal('top', 'left', 'middle', 'right');
      // Just verify no exceptions and result is string
      expect(typeof top).toBe('string');
      expect(typeof bottom).toBe('string');
    });
  });
});
