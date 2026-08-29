// @ts-check

import { splitLines } from '@yowazi/rangi';
import { charWidth } from '@yowazi/singi';
import {
  bold, noBold, dim, noDim, italic, noItalic,
  underline, noUnderline, blink, noBlink,
  invert, noInvert, strike, noStrike, sgr,
} from '@yowazi/singi';

/**
 * @typedef {object} Cell
 * @property {string} char - The rendered character (empty '' for width-0 continuation cells)
 * @property {number} width - 0, 1, or 2 (0 = continuation of previous wide char)
 * @property {Set<string>} attrs - Text attributes: 'bold', 'dim', 'italic', 'underline', 'blink', 'invert', 'strike'
 * @property {import('@yowazi/rangi').ColorSpec | null} fg - Foreground color (semantic or RGB) or null
 * @property {import('@yowazi/rangi').ColorSpec | null} bg - Background color (semantic or RGB) or null
 */

/**
 * Build escape-code lookup map from singi escape functions.
 * Maps from escape code string to { kind, ... } metadata.
 * @private
 * @returns {Map<string, {kind: string, attr?: string, channel?: string, value?: boolean}>}
 */
function buildEscapeLookup() {
  const map = new Map();

  // Attributes (on/off pairs)
  map.set(bold(), { kind: 'attr', attr: 'bold', on: true });
  map.set(noBold(), { kind: 'attr', attr: 'bold', on: false });

  map.set(dim(), { kind: 'attr', attr: 'dim', on: true });
  map.set(noDim(), { kind: 'attr', attr: 'dim', on: false });

  map.set(italic(), { kind: 'attr', attr: 'italic', on: true });
  map.set(noItalic(), { kind: 'attr', attr: 'italic', on: false });

  map.set(underline(), { kind: 'attr', attr: 'underline', on: true });
  map.set(noUnderline(), { kind: 'attr', attr: 'underline', on: false });

  map.set(blink(), { kind: 'attr', attr: 'blink', on: true });
  map.set(noBlink(), { kind: 'attr', attr: 'blink', on: false });

  map.set(invert(), { kind: 'attr', attr: 'invert', on: true });
  map.set(noInvert(), { kind: 'attr', attr: 'invert', on: false });

  map.set(strike(), { kind: 'attr', attr: 'strike', on: true });
  map.set(noStrike(), { kind: 'attr', attr: 'strike', on: false });

  // Color resets (channels)
  map.set(sgr(39), { kind: 'channel', channel: 'fg', clear: true });
  map.set(sgr(49), { kind: 'channel', channel: 'bg', clear: true });

  return map;
}

/**
 * Lazily-built escape lookup map (cached at module level).
 * @type {Map<string, {kind: string, attr?: string, channel?: string, value?: boolean}> | null}
 */
let escapeLookup = null;

/**
 * Get the escape lookup map, building it once on first call.
 * @private
 * @returns {Map<string, {kind: string, attr?: string, channel?: string, value?: boolean}>}
 */
function getEscapeLookup() {
  if (!escapeLookup) {
    escapeLookup = buildEscapeLookup();
  }
  return escapeLookup;
}

/**
 * Parse an SGR escape code to extract RGB values if present.
 * Handles: \x1b[38;2;r;g;bm (foreground) and \x1b[48;2;r;g;bm (background)
 *
 * @param {string} code - The SGR code (with or without \x1b)
 * @returns {{type: 'rgb', channel: 'fg'|'bg', value: [number, number, number]} | null}
 */
function parseRGBCode(code) {
  // Extract the parameter string (between [ and m)
  const match = code.match(/\[([0-9;]+)m/);
  if (!match) return null;

  const params = match[1].split(';').map(Number);

  // Check for 38;2;r;g;b (foreground TrueColor)
  if (params[0] === 38 && params[1] === 2 && params.length >= 5) {
    return {
      type: 'rgb',
      channel: 'fg',
      value: [params[2], params[3], params[4]],
    };
  }

  // Check for 48;2;r;g;b (background TrueColor)
  if (params[0] === 48 && params[1] === 2 && params.length >= 5) {
    return {
      type: 'rgb',
      channel: 'bg',
      value: [params[2], params[3], params[4]],
    };
  }

  return null;
}

/**
 * Parse a styled block (ANSI-decorated string) into a 2D cell grid.
 *
 * @param {string} block - Multi-line block (may contain ANSI codes)
 * @returns {Cell[][] | null} - 2D array of cells, one array per line (null if empty)
 */
export function parseStyledBlock(block) {
  if (!block) return null;

  const lines = splitLines(block);
  const lookup = getEscapeLookup();

  const rows = [];

  for (const line of lines) {
    const cells = [];

    // Current state (reset at start of each line to match CSS line-box model)
    const attrs = new Set();
    let fg = null;
    let bg = null;

    // SGR code regex
    const sgrRegex = /\x1b\[[0-9;]*m/g;

    let lastIndex = 0;
    let match;

    while ((match = sgrRegex.exec(line)) !== null) {
      const codeStart = match.index;
      const code = match[0];

      // Process visible characters between last position and this code
      if (codeStart > lastIndex) {
        const visibleText = line.slice(lastIndex, codeStart);
        for (const chr of visibleText) {
          const w = charWidth(chr);
          cells.push({
            char: chr,
            width: w,
            attrs: new Set(attrs),
            fg,
            bg,
          });

          // If this is a width-2 character, add a width-0 continuation cell
          if (w === 2) {
            cells.push({
              char: '',
              width: 0,
              attrs: new Set(attrs),
              fg,
              bg,
            });
          }
        }
      }

      // Process the SGR code
      const entry = lookup.get(code);
      if (entry) {
        if (entry.kind === 'attr') {
          if (entry.on) {
            attrs.add(entry.attr);
          } else {
            attrs.delete(entry.attr);
          }
        } else if (entry.kind === 'channel') {
          if (entry.channel === 'fg') fg = null;
          else if (entry.channel === 'bg') bg = null;
        }
      } else {
        // Try parsing as RGB code
        const rgbData = parseRGBCode(code);
        if (rgbData) {
          if (rgbData.channel === 'fg') {
            fg = { type: 'rgb', value: rgbData.value };
          } else {
            bg = { type: 'rgb', value: rgbData.value };
          }
        }
      }

      lastIndex = codeStart + code.length;
    }

    // Process any remaining visible characters after last code
    if (lastIndex < line.length) {
      const visibleText = line.slice(lastIndex);
      for (const chr of visibleText) {
        const w = charWidth(chr);
        cells.push({
          char: chr,
          width: w,
          attrs: new Set(attrs),
          fg,
          bg,
        });

        if (w === 2) {
          cells.push({
            char: '',
            width: 0,
            attrs: new Set(attrs),
            fg,
            bg,
          });
        }
      }
    }

    rows.push(cells);
  }

  return rows.length > 0 ? rows : null;
}
