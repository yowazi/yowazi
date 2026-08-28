// @ts-check

/**
 * Unicode character width detection for terminal rendering.
 *
 * Calculates display width of characters accounting for:
 * - ASCII (1 column)
 * - Control characters (0 columns)
 * - Emoji (2 columns)
 * - CJK characters (2 columns)
 * - Combining marks (0 columns)
 * - Surrogate pairs (handled transparently)
 *
 * Essential for cursor positioning and text layout in terminals.
 */

/**
 * Get display width of a single character in columns.
 *
 * Handles surrogate pairs for emoji and characters beyond BMP.
 *
 * @param {string} chr - Single character (may be surrogate pair)
 * @returns {number} Width in columns (0, 1, or 2)
 */
export function charWidth(chr) {
  if (!chr) return 0;

  const code = chr.charCodeAt(0);

  // Control characters (0x00-0x1f, 0x7f)
  if (code < 0x20 || code === 0x7f) {
    return 0;
  }

  // ASCII printable (0x20-0x7e)
  if (code < 0x7f) {
    return 1;
  }

  // High surrogate (first half of emoji/emoji beyond BMP)
  // These are always emoji, so return 2
  if (code >= 0xd800 && code <= 0xdbff) {
    return 2;
  }

  // Combining marks and zero-width characters (0x0300-0x036f, etc.)
  if (isComposingCharacter(code)) {
    return 0;
  }

  // Emoji and other wide characters
  if (isWideCharacter(code)) {
    return 2;
  }

  // Default to single width
  return 1;
}

/**
 * Get total display width of a string in columns.
 *
 * Strips ANSI escape sequences and handles multi-byte UTF-8 characters and emoji.
 *
 * @param {string} str - String to measure
 * @returns {number} Total width in columns
 *
 * @example
 * stringWidth('hello')      // 5
 * stringWidth('café')       // 4
 * stringWidth('你好')        // 4 (2 CJK chars × 2)
 * stringWidth('👋world')    // 7 (👋=2 + world=5)
 * stringWidth('\x1b[1mhello\x1b[0m')  // 5 (bold codes stripped)
 */
export function stringWidth(str) {
  // Strip ANSI escape sequences before measuring width
  const cleanStr = str.replace(/\x1b\[[0-9;]*m/g, '');
  let width = 0;

  for (const chr of cleanStr) {
    width += charWidth(chr);
  }

  return width;
}

/**
 * Slice string to fit within max width.
 *
 * Returns substring that fits within the given column width,
 * accounting for multi-column characters and ANSI escape codes.
 *
 * Strips ANSI codes before measuring to ensure accurate width calculation,
 * then preserves them in the returned string.
 *
 * @param {string} str - String to slice
 * @param {number} maxWidth - Maximum width in columns
 * @returns {string} Substring fitting within maxWidth
 *
 * @example
 * sliceWidth('hello', 3)    // 'hel'
 * sliceWidth('你好world', 5) // '你好wo' (你=2, 好=2, w=1)
 * sliceWidth('\x1b[1mhello\x1b[0m', 3) // '\x1b[1mhel\x1b[0m'
 */
export function sliceWidth(str, maxWidth) {
  // Extract ANSI codes and their positions
  const ansiRegex = /\x1b\[[0-9;]*m/g;
  const codes = [];
  let match;

  while ((match = ansiRegex.exec(str)) !== null) {
    codes.push({ index: match.index, code: match[0], length: match[0].length });
  }

  // If no ANSI codes, use simple slicing
  if (codes.length === 0) {
    let width = 0;
    let index = 0;

    for (const chr of str) {
      const chrWidth = charWidth(chr);
      if (width + chrWidth > maxWidth) {
        break;
      }
      width += chrWidth;
      index += chr.length;
    }

    return str.slice(0, index);
  }

  // For ANSI-encoded strings, iterate through original string tracking width
  let width = 0;
  let result = '';
  let codeIndex = 0;
  let cutoffPos = str.length; // Track where we stop collecting content

  for (let i = 0; i < str.length; i++) {
    // Check if we're at an ANSI code position
    if (codeIndex < codes.length && i === codes[codeIndex].index) {
      // Add the entire ANSI code without counting width
      result += codes[codeIndex].code;
      i += codes[codeIndex].length - 1; // Skip past the code
      codeIndex++;
      continue;
    }

    // This is a regular character
    const chr = str[i];
    const chrWidth = charWidth(chr);

    if (width + chrWidth > maxWidth) {
      cutoffPos = i;
      break;
    }

    width += chrWidth;
    result += chr;
  }

  // Append any trailing ANSI codes that come after our cutoff
  while (codeIndex < codes.length && codes[codeIndex].index >= cutoffPos) {
    result += codes[codeIndex].code;
    codeIndex++;
  }

  return result;
}

/**
 * Pad string to exact width with spaces.
 *
 * @param {string} str - String to pad
 * @param {number} width - Target width in columns
 * @param {'left' | 'right'} [align='right'] - Alignment
 * @returns {string} Padded string
 *
 * @example
 * padWidth('hello', 10)      // '     hello'
 * padWidth('hi', 5, 'left')  // 'hi   '
 */
export function padWidth(str, width, align = 'right') {
  const current = stringWidth(str);
  if (current >= width) return str;

  const padding = ' '.repeat(width - current);
  return align === 'left' ? str + padding : padding + str;
}

/**
 * Truncate string to fit within width, with optional suffix.
 *
 * @param {string} str - String to truncate
 * @param {number} maxWidth - Maximum width in columns
 * @param {string} [suffix=''] - Suffix if truncated (e.g., '...')
 * @returns {string} Truncated string
 *
 * @example
 * truncateWidth('hello world', 8)     // 'hello wo'
 * truncateWidth('hello world', 8, '…') // 'hello w…'
 */
export function truncateWidth(str, maxWidth, suffix = '') {
  const suffixWidth = stringWidth(suffix);
  if (suffixWidth >= maxWidth) return suffix.slice(0, maxWidth);

  const sliced = sliceWidth(str, maxWidth - suffixWidth);
  return sliced + suffix;
}

// ============================================================
// Private helpers
// ============================================================

function isComposingCharacter(code) {
  // Combining diacritical marks (0x0300-0x036f)
  if (code >= 0x0300 && code <= 0x036f) return true;

  // Variation selectors (0xfe00-0xfe0f)
  if (code >= 0xfe00 && code <= 0xfe0f) return true;

  // Combining marks extended
  if (code >= 0x1ab0 && code <= 0x1aff) return true;
  if (code >= 0x1dc0 && code <= 0x1dff) return true;

  return false;
}

function isWideCharacter(code) {
  // Emoji and Symbols (0x1f000+)
  if (code >= 0x1f000) return true;

  // CJK Unified Ideographs
  if (code >= 0x4e00 && code <= 0x9fff) return true;

  // CJK Unified Ideographs Extension A
  if (code >= 0x3400 && code <= 0x4dbf) return true;

  // Hiragana and Katakana
  if (code >= 0x3040 && code <= 0x309f) return true;
  if (code >= 0x30a0 && code <= 0x30ff) return true;

  // Hangul
  if (code >= 0xac00 && code <= 0xd7af) return true;

  // Fullwidth forms (including fullwidth ASCII)
  if (code >= 0xff00 && code <= 0xffef) return true;

  // Dingbats (includes hearts, symbols, etc.)
  if (code >= 0x2700 && code <= 0x27bf) return true;

  // Box drawing and block elements - most are single-width
  // Only the block elements (0x2588-0x259f) are typically wide
  // All other box drawing characters (0x2500-0x2587) are single-width
  if (code >= 0x2588 && code <= 0x259f) return true;

  // Miscellaneous Symbols and Arrows
  if (code >= 0x2b00 && code <= 0x2bff) return true;

  // Miscellaneous symbols and pictographs
  if (code >= 0x1f300 && code <= 0x1f5ff) return true;

  // Transport and map symbols
  if (code >= 0x1f680 && code <= 0x1f6ff) return true;

  // Emoticons
  if (code >= 0x1f600 && code <= 0x1f64f) return true;

  return false;
}
