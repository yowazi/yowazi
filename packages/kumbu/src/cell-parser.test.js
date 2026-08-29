// @ts-check

import { describe, it, expect } from 'bun:test';
import { parseStyledBlock } from './cell-parser.js';
import { Style } from '@yowazi/rangi';

describe('cell-parser', () => {
  describe('parseStyledBlock', () => {
    it('should parse plain text into cells', () => {
      const block = 'hello';
      const cells = parseStyledBlock(block);
      expect(cells).toBeDefined();
      expect(cells[0]).toHaveLength(5);
      expect(cells[0][0].char).toBe('h');
      expect(cells[0][0].width).toBe(1);
    });

    it('should handle empty input', () => {
      const cells = parseStyledBlock('');
      expect(cells).toBeNull();
    });

    it('should handle null input', () => {
      const cells = parseStyledBlock(null);
      expect(cells).toBeNull();
    });

    it('should parse styled text (bold)', () => {
      const bold = new Style().bold();
      const block = bold.render('hi');
      const cells = parseStyledBlock(block);
      expect(cells).toBeDefined();
      expect(cells[0][0].attrs.has('bold')).toBe(true);
    });

    it('should parse multiline blocks', () => {
      const block = 'line1\nline2\nline3';
      const cells = parseStyledBlock(block);
      expect(cells).toHaveLength(3);
      expect(cells[0]).toHaveLength(5);
      expect(cells[1]).toHaveLength(5);
      expect(cells[2]).toHaveLength(5);
    });

    it('should handle wide characters (emoji)', () => {
      const block = 'a🙂b';  // 🙂 should be width 2
      const cells = parseStyledBlock(block);
      expect(cells).toBeDefined();
      const row = cells[0];
      // Should have: 'a' (width 1), '🙂' (width 2) + continuation, 'b' (width 1)
      expect(row[0].char).toBe('a');
      expect(row[0].width).toBe(1);
      expect(row[1].char).toBe('🙂');
      expect(row[1].width).toBe(2);
      expect(row[2].width).toBe(0); // continuation
      expect(row[3].char).toBe('b');
      expect(row[3].width).toBe(1);
    });

    it('should preserve attributes through parsing', () => {
      const complex = new Style().bold().underline().italic();
      const block = complex.render('styled');
      const cells = parseStyledBlock(block);
      expect(cells).toBeDefined();
      expect(cells[0][0].attrs.has('bold')).toBe(true);
      expect(cells[0][0].attrs.has('underline')).toBe(true);
      expect(cells[0][0].attrs.has('italic')).toBe(true);
    });

    it('should track attributes independently', () => {
      const boldItalic = new Style().bold().italic();
      const block = boldItalic.render('text');
      const cells = parseStyledBlock(block);
      expect(cells[0][0].attrs.has('bold')).toBe(true);
      expect(cells[0][0].attrs.has('italic')).toBe(true);
    });
  });
});
