// @ts-check

/**
 * Composition: Joining rendered blocks into larger layouts
 *
 * These functions take pre-rendered strings (output of `.render()`) and arrange them:
 * - `joinVertical()` stacks blocks top-to-bottom, equalizing width
 * - `joinHorizontal()` places blocks side-by-side, equalizing height
 *
 * All ANSI escape codes (colors, attributes) are preserved through composition.
 *
 * Key insight: Alignment direction pairs with the dimension being equalized:
 * - joinVertical aligns horizontally (left/center/right) because it's equalizing width
 * - joinHorizontal aligns vertically (top/center/bottom) because it's equalizing height
 */

import { stringWidth } from '@yowazi/singi';
import { splitLines, joinLines, alignLine, normalizeBlock } from './box.js';

/**
 * Join blocks vertically (stack top-to-bottom).
 *
 * All blocks are padded to the same width using the given alignment.
 * The result is a single string with all blocks stacked.
 *
 * @param {'left' | 'center' | 'right'} align - Alignment direction for lines of different widths
 * @param {...string} blocks - Pre-rendered blocks to join (each may contain ANSI codes)
 * @returns {string} All blocks stacked vertically, lines joined with '\n'
 * @throws {Error} if blocks array is empty or align is invalid
 *
 * @example
 * const box1 = new Style().border('rounded').render('Hello');
 * const box2 = new Style().border('rounded').render('World');
 * const result = joinVertical('center', box1, box2);
 */
export function joinVertical(align, ...blocks) {
  if (!blocks || blocks.length === 0) {
    throw new Error('joinVertical requires at least one block');
  }
  if (align !== 'left' && align !== 'center' && align !== 'right') {
    throw new Error(`Invalid alignment: "${align}". Must be 'left', 'center', or 'right'`);
  }

  // Flatten all blocks into one line array and find max width
  const allLines = blocks.flatMap(block => splitLines(block));
  const maxWidth = Math.max(...allLines.map(line => stringWidth(line)));

  // Align each line to maxWidth
  const alignedLines = allLines.map(line => alignLine(line, maxWidth, align));

  return joinLines(alignedLines);
}

/**
 * Join blocks horizontally (place side-by-side).
 *
 * All blocks are padded to the same height using the given alignment.
 * Blocks are placed left-to-right, one line at a time.
 *
 * @param {'top' | 'center' | 'bottom'} align - Vertical alignment when blocks have different heights
 * @param {...string} blocks - Pre-rendered blocks to join (each may contain ANSI codes)
 * @returns {string} All blocks placed horizontally, lines joined with '\n'
 * @throws {Error} if blocks array is empty or align is invalid
 *
 * @example
 * const sidebar = new Style().width(20).render('Sidebar content');
 * const main = new Style().render('Main content');
 * const result = joinHorizontal('top', sidebar, main);
 */
export function joinHorizontal(align, ...blocks) {
  if (!blocks || blocks.length === 0) {
    throw new Error('joinHorizontal requires at least one block');
  }
  if (align !== 'top' && align !== 'center' && align !== 'bottom') {
    throw new Error(`Invalid alignment: "${align}". Must be 'top', 'center', or 'bottom'`);
  }

  // Normalize each block: ensure its own lines are uniform width
  const normalized = blocks.map(block => normalizeBlock(block));

  // Find max height across all blocks
  const maxHeight = Math.max(...normalized.map(b => b.height));

  // Split each block into lines and pad height only (not width)
  const allBlockLines = normalized.map(blockMeta => {
    const lines = splitLines(blockMeta.text);
    const heightPadding = maxHeight - lines.length;

    if (heightPadding === 0) return lines;

    // Add blank lines at top, bottom, or split (depending on align)
    const blankLine = ' '.repeat(blockMeta.width);
    switch (align) {
      case 'top':
        // Add blank lines at bottom
        return [...lines, ...Array(heightPadding).fill(blankLine)];
      case 'bottom':
        // Add blank lines at top
        return [...Array(heightPadding).fill(blankLine), ...lines];
      case 'center': {
        // Split: extra goes at bottom (matching alignLine convention)
        const topPad = Math.floor(heightPadding / 2);
        const bottomPad = heightPadding - topPad;
        return [
          ...Array(topPad).fill(blankLine),
          ...lines,
          ...Array(bottomPad).fill(blankLine),
        ];
      }
      default:
        return lines; // Should never reach here due to earlier validation
    }
  });

  // Concatenate blocks horizontally, line by line
  const result = [];
  for (let lineIdx = 0; lineIdx < maxHeight; lineIdx++) {
    const lineSegments = allBlockLines.map(blockLines => blockLines[lineIdx] || '');
    result.push(lineSegments.join(''));
  }

  return joinLines(result);
}
