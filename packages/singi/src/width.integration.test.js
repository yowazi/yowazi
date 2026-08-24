// @ts-check

/**
 * Integration tests for character width calculations
 *
 * Tests real-world scenarios: list alignment, table layout, text truncation
 */

import { describe, it, expect } from 'bun:test';
import { stringWidth, sliceWidth, padWidth, truncateWidth } from './width.js';

describe('width - Real-world scenarios', () => {
  it('aligns list items correctly with mixed emoji', () => {
    const items = [
      '🐧 Linux',
      '🍎 macOS',
      '🪟 Windows',
      '🔧 BSD',
      '📱 Mobile',
    ];

    // Calculate max width for alignment
    let maxWidth = 0;
    items.forEach(item => {
      maxWidth = Math.max(maxWidth, stringWidth(item));
    });

    expect(maxWidth).toBe(10); // 🪟 Windows is the widest

    // Verify all items can be padded to alignment
    const aligned = items.map(item => {
      const itemWidth = stringWidth(item);
      const padding = ' '.repeat(Math.max(0, maxWidth - itemWidth));
      return item + padding;
    });

    // All aligned items should have same visual width
    aligned.forEach(line => {
      expect(stringWidth(line)).toBe(maxWidth);
    });
  });

  it('handles table column alignment with CJK characters', () => {
    const table = [
      { name: 'Alice', city: '北京' },
      { name: 'Bob', city: '东京' },
      { name: 'Charlie', city: 'Seoul' },
    ];

    // Find column widths
    let nameWidth = 0;
    let cityWidth = 0;

    table.forEach(row => {
      nameWidth = Math.max(nameWidth, stringWidth(row.name));
      cityWidth = Math.max(cityWidth, stringWidth(row.city));
    });

    expect(nameWidth).toBe(7); // "Charlie"
    expect(cityWidth).toBe(5); // "Seoul" is 5-width (max of CJK 4 and Seoul 5)

    // Render aligned table
    const lines = table.map(row => {
      return (
        padWidth(row.name, nameWidth) +
        ' | ' +
        padWidth(row.city, cityWidth)
      );
    });

    // Verify table structure
    expect(lines[0]).toContain('Alice');
    expect(lines[1]).toContain('Bob');
    expect(lines[2]).toContain('Charlie');
  });

  it('truncates text correctly when containing emoji', () => {
    const text = 'Hello 👋 World 🌍!';
    const truncated = truncateWidth(text, 10);

    // Visual width should not exceed 10
    expect(stringWidth(truncated)).toBeLessThanOrEqual(10);
  });

  it('slices emoji strings without breaking', () => {
    const text = '👋🪟😀 test';
    // Each emoji is 2-width, space is 1, test is 4
    // Total: 2+2+2+1+4 = 11

    const slice = sliceWidth(text, 5);
    // Should get: 👋🪟 (2+2+1 = 5)
    expect(stringWidth(slice)).toBeLessThanOrEqual(5);
  });

  it('pads strings with accented characters', () => {
    const text = 'café';
    const padded = padWidth(text, 10);

    expect(stringWidth(padded)).toBe(10);
    expect(padded.startsWith('      ')).toBe(true); // 6 spaces before café
  });

  it('handles combining marks in width calculation', () => {
    // é can be represented as e + combining accent
    const composed = 'café'; // é as single char
    const decomposed = 'café'; // e + combining acute

    // Both should calculate to similar widths
    const composedWidth = stringWidth(composed);
    const decomposedWidth = stringWidth(decomposed);

    expect(Math.abs(composedWidth - decomposedWidth)).toBeLessThanOrEqual(1);
  });

  it('calculates width for mixed content (ASCII, CJK, emoji)', () => {
    const mixed = 'Hello 世界 👋';
    const width = stringWidth(mixed);

    // H e l l o (5) + space (1) + 世 (2) + 界 (2) + space (1) + 👋 (2) = 13
    expect(width).toBe(13);
  });

  it('creates properly aligned status bar with mixed widths', () => {
    const status = {
      left: '📱 Terminal',
      right: '✅ Ready',
    };

    const width = 50;
    const leftWidth = stringWidth(status.left);
    const rightWidth = stringWidth(status.right);
    const middleWidth = width - leftWidth - rightWidth;

    const line = status.left + ' '.repeat(middleWidth) + status.right;

    expect(stringWidth(line)).toBe(width);
  });

  it('handles window emoji (U+1FA9F) in layout calculations', () => {
    const text = '🪟 Windows';
    const width = stringWidth(text);

    expect(width).toBe(10); // 2 + 1 + 7

    // Verify it pads correctly (padWidth pads on the left by default)
    const padded = padWidth(text, 15);
    expect(stringWidth(padded)).toBe(15);
    expect(padded.startsWith('     ')).toBe(true); // 5 spaces of padding on left
    expect(padded.includes('🪟 Windows')).toBe(true);
  });

  it('creates checkbox list with proper alignment', () => {
    const items = [
      '☐ Install updates',
      '☑ Configure system',
      '☐ Test deployment',
      '☑ Deploy to production',
    ];

    let maxWidth = 0;
    items.forEach(item => {
      maxWidth = Math.max(maxWidth, stringWidth(item));
    });

    const list = items.map(item => {
      const padding = ' '.repeat(Math.max(0, maxWidth - stringWidth(item)));
      return item + padding + ' | done';
    });

    // Verify all lines have consistent column alignment
    const columnStart = list[0].indexOf('|');
    list.forEach(line => {
      expect(line.indexOf('|')).toBe(columnStart);
    });
  });
});
