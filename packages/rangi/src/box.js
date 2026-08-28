// @ts-check

import { stringWidth, sliceWidth, padWidth } from '@yowazi/singi';

/**
 * Border styles: named character sets for common box-drawing patterns.
 * Each style defines 6 characters: top, bottom, left, right, topLeft, topRight, bottomLeft, bottomRight.
 *
 * @type {Record<string, {top: string, bottom: string, left: string, right: string, topLeft: string, topRight: string, bottomLeft: string, bottomRight: string}>}
 */
export const BORDER_STYLES = Object.freeze({
  normal: {
    top: '─',
    bottom: '─',
    left: '│',
    right: '│',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
  },
  rounded: {
    top: '─',
    bottom: '─',
    left: '│',
    right: '│',
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
  },
  thick: {
    top: '━',
    bottom: '━',
    left: '┃',
    right: '┃',
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
  },
  double: {
    top: '═',
    bottom: '═',
    left: '║',
    right: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
  },
});

/**
 * Resolve a border style name to its character set, or pass through a custom object.
 * @param {string | object} styleOrCustom - Named style ('normal', 'rounded', etc.) or custom char object
 * @returns {object} Border character set
 * @throws {Error} if styleOrCustom is a string but not a recognized style name
 */
export function resolveBorderChars(styleOrCustom) {
  if (typeof styleOrCustom === 'string') {
    const style = BORDER_STYLES[styleOrCustom];
    if (!style) {
      throw new Error(
        `Unknown border style: "${styleOrCustom}". Valid styles: ${Object.keys(BORDER_STYLES).join(', ')}`
      );
    }
    return style;
  }
  // Assume it's a custom object; no validation (user's responsibility)
  return styleOrCustom;
}

/**
 * Split text into lines.
 * @param {string} text
 * @returns {string[]} Array of lines (split by \n)
 */
export function splitLines(text) {
  return text.split('\n');
}

/**
 * Join lines back together.
 * @param {string[]} lines
 * @returns {string}
 */
export function joinLines(lines) {
  return lines.join('\n');
}

/**
 * Align or pad/truncate a single line to an exact width.
 * - If line is shorter than width: pads with spaces (direction depends on align)
 * - If line is longer than width: truncates using sliceWidth (preserves ANSI)
 *
 * @param {string} line - The line to align (may contain ANSI codes)
 * @param {number} width - Target visual width in columns
 * @param {'left' | 'center' | 'right'} align - Alignment direction
 * @returns {string} Line padded/truncated to exact width
 */
export function alignLine(line, width, align = 'left') {
  const current = stringWidth(line);

  if (current === width) return line;
  if (current > width) return sliceWidth(line, width);

  // Widening: add padding
  const padding = width - current;
  switch (align) {
    case 'left':
      // Left-aligned: add padding on the right
      return line + ' '.repeat(padding);
    case 'right':
      // Right-aligned: add padding on the left
      return ' '.repeat(padding) + line;
    case 'center': {
      // Center-aligned: split padding (extra goes on right, matching CSS convention)
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return ' '.repeat(leftPad) + line + ' '.repeat(rightPad);
    }
    default:
      throw new Error(`Unknown alignment: ${align}`);
  }
}

/**
 * Normalize a block: ensure all lines have equal visual width (left-aligned padding).
 * Useful before horizontal joining to ensure each block's lines are uniform.
 *
 * @param {string} block - Multi-line rendered block (may contain ANSI codes)
 * @returns {{text: string, width: number, height: number}} Normalized block with metadata
 */
export function normalizeBlock(block) {
  const lines = splitLines(block);
  const maxWidth = Math.max(...lines.map(line => stringWidth(line)));
  const normalizedLines = lines.map(line => alignLine(line, maxWidth, 'left'));
  return {
    text: joinLines(normalizedLines),
    width: maxWidth,
    height: lines.length,
  };
}
