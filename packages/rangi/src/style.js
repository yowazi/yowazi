// @ts-check

import {
  bold,
  italic,
  underline,
  dim,
  blink,
  invert,
  strike,
  noBold,
  noItalic,
  noUnderline,
  noDim,
  noBlink,
  noInvert,
  noStrike,
  sgr,
  fg,
  bg,
} from '@yowazi/singi';
import { stringWidth } from '@yowazi/singi';
import { getTheme } from './theme-context.js';
import {
  BORDER_STYLES,
  resolveBorderChars,
  splitLines,
  joinLines,
  alignLine,
  normalizeBlock,
} from './box.js';

/**
 * @typedef {object} ColorSpec
 * @property {'semantic'|'rgb'} type
 * @property {string} [role] - For semantic colors
 * @property {[number, number, number]} [value] - For RGB colors
 */

/**
 * Style is an immutable builder for creating ANSI-styled text.
 * Supports both semantic colors (via themes) and raw RGB colors,
 * plus text attributes (bold, italic, etc.).
 *
 * Styles compose correctly when nested—closing an inner style doesn't
 * wipe styling from the outer context thanks to per-channel disable codes
 * and reopen-on-close substitution.
 */
export class Style {
  constructor() {
    /** @type {Set<string>} */
    this._attributes = new Set();

    /** @type {ColorSpec | null} */
    this._foreground = null;

    /** @type {ColorSpec | null} */
    this._background = null;

    /** @type {object | null} Theme override, if any */
    this._theme = null;

    // ===== Box model =====
    /** @type {{top: number, right: number, bottom: number, left: number} | null} */
    this._padding = null;

    /** @type {{chars: object, sides: {top: boolean, right: boolean, bottom: boolean, left: boolean}} | null} */
    this._border = null;

    /** @type {ColorSpec | null} Border foreground color override */
    this._borderForeground = null;

    /** @type {ColorSpec | null} Border background color override */
    this._borderBackground = null;

    /** @type {ColorSpec | null} Inner (content/padding) foreground color override */
    this._innerForeground = null;

    /** @type {ColorSpec | null} Inner (content/padding) background color override */
    this._innerBackground = null;

    /** @type {number | null} Explicit width (rigid sizing) */
    this._width = null;

    /** @type {number | null} Explicit height (rigid sizing) */
    this._height = null;

    /** @type {'left' | 'center' | 'right'} Content alignment (only meaningful with width) */
    this._align = 'left';
  }

  // ===== Copy constructor for immutability =====

  /**
   * Create a shallow copy of this Style.
   * @private
   * @returns {Style}
   */
  _clone() {
    const copy = new Style();
    copy._attributes = new Set(this._attributes);
    copy._foreground = this._foreground;
    copy._background = this._background;
    copy._theme = this._theme;
    copy._padding = this._padding;
    copy._border = this._border;
    copy._borderForeground = this._borderForeground;
    copy._borderBackground = this._borderBackground;
    copy._innerForeground = this._innerForeground;
    copy._innerBackground = this._innerBackground;
    copy._width = this._width;
    copy._height = this._height;
    copy._align = this._align;
    return copy;
  }

  // ===== Text attributes =====

  bold() {
    const copy = this._clone();
    copy._attributes.add('bold');
    return copy;
  }

  italic() {
    const copy = this._clone();
    copy._attributes.add('italic');
    return copy;
  }

  underline() {
    const copy = this._clone();
    copy._attributes.add('underline');
    return copy;
  }

  dim() {
    const copy = this._clone();
    copy._attributes.add('dim');
    return copy;
  }

  blink() {
    const copy = this._clone();
    copy._attributes.add('blink');
    return copy;
  }

  invert() {
    const copy = this._clone();
    copy._attributes.add('invert');
    return copy;
  }

  strike() {
    const copy = this._clone();
    copy._attributes.add('strike');
    return copy;
  }

  // ===== Colors =====

  /**
   * Set foreground to a semantic role (e.g. 'primary', 'error').
   * @param {string} role
   * @returns {Style}
   */
  foreground(role) {
    const copy = this._clone();
    copy._foreground = { type: 'semantic', role };
    return copy;
  }

  /**
   * Set background to a semantic role.
   * @param {string} role
   * @returns {Style}
   */
  background(role) {
    const copy = this._clone();
    copy._background = { type: 'semantic', role };
    return copy;
  }

  /**
   * Set foreground to a raw RGB color.
   * @param {number} r 0–255
   * @param {number} g 0–255
   * @param {number} b 0–255
   * @returns {Style}
   */
  foregroundRGB(r, g, b) {
    const copy = this._clone();
    copy._foreground = { type: 'rgb', value: [r, g, b] };
    return copy;
  }

  /**
   * Set background to a raw RGB color.
   * @param {number} r 0–255
   * @param {number} g 0–255
   * @param {number} b 0–255
   * @returns {Style}
   */
  backgroundRGB(r, g, b) {
    const copy = this._clone();
    copy._background = { type: 'rgb', value: [r, g, b] };
    return copy;
  }

  /**
   * Override the global theme for this style only.
   * @param {object} theme - A Theme instance
   * @returns {Style}
   */
  theme(theme) {
    const copy = this._clone();
    copy._theme = theme;
    return copy;
  }

  // ===== Box Model =====

  /**
   * Set padding (space inside border, around content).
   * Supports CSS-style shorthand: 1, 2, or 4 values.
   *
   * @param {...number} args - 1 arg: all sides | 2 args: [vertical, horizontal] | 4 args: [top, right, bottom, left]
   * @returns {Style}
   */
  padding(...args) {
    const copy = this._clone();
    let top, right, bottom, left;

    if (args.length === 1) {
      top = right = bottom = left = args[0];
    } else if (args.length === 2) {
      top = bottom = args[0];
      right = left = args[1];
    } else if (args.length === 4) {
      [top, right, bottom, left] = args;
    } else {
      throw new Error(
        `padding() expects 1, 2, or 4 arguments, got ${args.length}`
      );
    }

    copy._padding = { top, right, bottom, left };
    return copy;
  }

  /**
   * Set border style (normal, rounded, thick, double, or custom char object).
   *
   * @param {string | object} [style='normal'] - Named style or custom char object
   * @returns {Style}
   */
  border(style = 'normal') {
    const copy = this._clone();
    const chars = resolveBorderChars(style);
    copy._border = {
      chars,
      sides: { top: true, right: true, bottom: true, left: true },
    };
    return copy;
  }

  /**
   * Toggle specific border sides on/off.
   * No-op if border() has not been called yet (documented behavior).
   *
   * @param {{top?: boolean, right?: boolean, bottom?: boolean, left?: boolean}} partial - Sides to update
   * @returns {Style}
   */
  borderSides(partial) {
    const copy = this._clone();
    if (copy._border) {
      copy._border = {
        chars: copy._border.chars,
        sides: { ...copy._border.sides, ...partial },
      };
    }
    return copy;
  }

  /**
   * Set border foreground color (semantic role).
   *
   * @param {string} role - Semantic role (e.g. 'primary', 'error')
   * @returns {Style}
   */
  borderForeground(role) {
    const copy = this._clone();
    copy._borderForeground = { type: 'semantic', role };
    return copy;
  }

  /**
   * Set border foreground color (raw RGB).
   *
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {Style}
   */
  borderForegroundRGB(r, g, b) {
    const copy = this._clone();
    copy._borderForeground = { type: 'rgb', value: [r, g, b] };
    return copy;
  }

  /**
   * Set border background color (semantic role).
   *
   * @param {string} role - Semantic role (e.g. 'primary', 'error')
   * @returns {Style}
   */
  borderBackground(role) {
    const copy = this._clone();
    copy._borderBackground = { type: 'semantic', role };
    return copy;
  }

  /**
   * Set border background color (raw RGB).
   *
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {Style}
   */
  borderBackgroundRGB(r, g, b) {
    const copy = this._clone();
    copy._borderBackground = { type: 'rgb', value: [r, g, b] };
    return copy;
  }

  /**
   * Set inner content/padding foreground color (semantic role).
   * This overrides the main foreground() for content and padding only.
   *
   * @param {string} role - Semantic role (e.g. 'primary', 'error')
   * @returns {Style}
   */
  innerForeground(role) {
    const copy = this._clone();
    copy._innerForeground = { type: 'semantic', role };
    return copy;
  }

  /**
   * Set inner content/padding foreground color (raw RGB).
   *
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {Style}
   */
  innerForegroundRGB(r, g, b) {
    const copy = this._clone();
    copy._innerForeground = { type: 'rgb', value: [r, g, b] };
    return copy;
  }

  /**
   * Set inner content/padding background color (semantic role).
   * This overrides the main background() for content and padding only.
   *
   * @param {string} role - Semantic role (e.g. 'primary', 'error')
   * @returns {Style}
   */
  innerBackground(role) {
    const copy = this._clone();
    copy._innerBackground = { type: 'semantic', role };
    return copy;
  }

  /**
   * Set inner content/padding background color (raw RGB).
   *
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {Style}
   */
  innerBackgroundRGB(r, g, b) {
    const copy = this._clone();
    copy._innerBackground = { type: 'rgb', value: [r, g, b] };
    return copy;
  }

  /**
   * Set exact width (rigid sizing).
   * Width includes padding and borders — the total rendered width will be exactly `n` columns.
   * Blocks with explicit width do not participate in equal distribution in joins.
   *
   * @param {number} n - Total width in columns (including padding and borders)
   * @returns {Style}
   */
  width(n) {
    const copy = this._clone();
    if (typeof n !== 'number' || n < 1 || !Number.isInteger(n)) {
      throw new Error(`width() expects a positive integer, got ${n}`);
    }
    copy._width = n;
    return copy;
  }

  /**
   * Set exact height (rigid sizing).
   *
   * @param {number} n - Height in lines
   * @returns {Style}
   */
  height(n) {
    const copy = this._clone();
    if (typeof n !== 'number' || n < 1 || !Number.isInteger(n)) {
      throw new Error(`height() expects a positive integer, got ${n}`);
    }
    copy._height = n;
    return copy;
  }

  /**
   * Set content alignment (only meaningful with explicit width).
   *
   * @param {'left' | 'center' | 'right'} direction
   * @returns {Style}
   */
  align(direction) {
    const copy = this._clone();
    if (direction !== 'left' && direction !== 'center' && direction !== 'right') {
      throw new Error(
        `align() expects 'left', 'center', or 'right', got "${direction}"`
      );
    }
    copy._align = direction;
    return copy;
  }

  // ===== Box Model Utilities =====

  /**
   * Check if any box-model property is set (triggers _renderBox instead of inline).
   * @private
   * @returns {boolean}
   */
  _hasBoxModel() {
    return (
      this._padding !== null ||
      this._border !== null ||
      this._width !== null ||
      this._height !== null
    );
  }

  // ===== Rendering =====

  /**
   * Get the ANSI escape prefix codes for this style.
   * Includes all enabled attributes, followed by foreground and background colors.
   * @returns {string}
   */
  open() {
    const codes = [];

    // Add attribute codes
    if (this._attributes.has('bold')) codes.push(bold());
    if (this._attributes.has('dim')) codes.push(dim());
    if (this._attributes.has('italic')) codes.push(italic());
    if (this._attributes.has('underline')) codes.push(underline());
    if (this._attributes.has('blink')) codes.push(blink());
    if (this._attributes.has('invert')) codes.push(invert());
    if (this._attributes.has('strike')) codes.push(strike());

    // Add color codes
    const theme = this._theme || getTheme();

    if (this._foreground) {
      if (this._foreground.type === 'semantic') {
        codes.push(theme.ansi(this._foreground.role, 'fg'));
      } else {
        const [r, g, b] = this._foreground.value;
        codes.push(fg(r, g, b));
      }
    }

    if (this._background) {
      if (this._background.type === 'semantic') {
        codes.push(theme.ansi(this._background.role, 'bg'));
      } else {
        const [r, g, b] = this._background.value;
        codes.push(bg(r, g, b));
      }
    }

    return codes.join('');
  }

  /**
   * Get the ANSI escape suffix codes to close only this style's open channels.
   * Uses per-channel disable codes, not a global reset, so composition works correctly.
   * @returns {string}
   */
  close() {
    const codes = [];

    // Close attributes in reverse order (good practice, though not strictly necessary)
    if (this._attributes.has('strike')) codes.push(noStrike());
    if (this._attributes.has('invert')) codes.push(noInvert());
    if (this._attributes.has('blink')) codes.push(noBlink());
    if (this._attributes.has('underline')) codes.push(noUnderline());
    if (this._attributes.has('italic')) codes.push(noItalic());
    if (this._attributes.has('dim')) codes.push(noDim());
    if (this._attributes.has('bold')) codes.push(noBold());

    // Close colors
    if (this._foreground) codes.push(sgr(39)); // default foreground
    if (this._background) codes.push(sgr(49)); // default background

    return codes.join('');
  }

  /**
   * Substitute any occurrence of this style's close codes in text with close + reopen.
   * This allows nested styles to work correctly: when an inner style closes a channel
   * that the outer style also has set, the outer's value resumes immediately after.
   *
   * @private
   * @param {string} text
   * @returns {string}
   */
  _reopenOnClose(text) {
    let result = text;

    // Build the set of close codes this style produces
    const closeCodesInOrder = [];

    if (this._attributes.has('strike')) closeCodesInOrder.push({ code: noStrike(), isAttr: true });
    if (this._attributes.has('invert')) closeCodesInOrder.push({ code: noInvert(), isAttr: true });
    if (this._attributes.has('blink')) closeCodesInOrder.push({ code: noBlink(), isAttr: true });
    if (this._attributes.has('underline')) closeCodesInOrder.push({ code: noUnderline(), isAttr: true });
    if (this._attributes.has('italic')) closeCodesInOrder.push({ code: noItalic(), isAttr: true });
    if (this._attributes.has('dim')) closeCodesInOrder.push({ code: noDim(), isAttr: true });
    if (this._attributes.has('bold')) closeCodesInOrder.push({ code: noBold(), isAttr: true });

    if (this._foreground) closeCodesInOrder.push({ code: sgr(39), isAttr: false, isFg: true });
    if (this._background) closeCodesInOrder.push({ code: sgr(49), isAttr: false, isBg: true });

    // Replace each close code with close + reopen
    const reopen = this.open();
    for (const { code } of closeCodesInOrder) {
      result = result.split(code).join(code + reopen);
    }

    return result;
  }

  /**
   * Render text with this style applied.
   * Branches: if any box-model property is set, uses _renderBox for multi-line layout.
   * Otherwise uses the inline path: open() + reopenOnClose(text) + close().
   *
   * @param {string} text
   * @returns {string}
   */
  render(text) {
    if (this._hasBoxModel()) {
      return this._renderBox(text);
    }
    const prefix = this.open();
    const reopened = this._reopenOnClose(text);
    const suffix = this.close();
    return prefix + reopened + suffix;
  }

  /**
   * Render text as a box with padding, borders, and sizing.
   * Multi-line layout: applies open/close per line for correct nested composition.
   * @private
   * @param {string} text
   * @returns {string}
   */
  _renderBox(text) {
    // Step 1: Split content into lines
    let lines = splitLines(text);

    // Step 2a: Get padding values (needed to calculate content width)
    const padTop = this._padding?.top ?? 0;
    const padRight = this._padding?.right ?? 0;
    const padBottom = this._padding?.bottom ?? 0;
    const padLeft = this._padding?.left ?? 0;

    // Step 2b: If width is set, it's the TOTAL box width (including padding and borders).
    // Subtract padding and border to get content width.
    let contentWidth;
    if (this._width !== null) {
      let totalWidth = this._width;
      // Subtract padding
      totalWidth -= (padLeft + padRight);
      // Subtract border widths (if borders exist)
      if (this._border !== null) {
        if (this._border.sides.left) totalWidth -= 1;
        if (this._border.sides.right) totalWidth -= 1;
      }
      contentWidth = Math.max(1, totalWidth); // Ensure minimum 1-char width
    } else {
      contentWidth = Math.max(...lines.map(line => stringWidth(line)), 0);
    }

    const contentHeight =
      this._height !== null ? this._height : lines.length;

    // Step 3: Align/fit each line to contentWidth
    lines = lines.map(line => alignLine(line, contentWidth, this._align));

    // Step 4: Pad height (add blank lines if needed)
    if (lines.length < contentHeight) {
      const blankLine = ' '.repeat(contentWidth);
      while (lines.length < contentHeight) {
        lines.push(blankLine);
      }
    } else if (lines.length > contentHeight) {
      lines = lines.slice(0, contentHeight);
    }

    // Step 5: Apply padding (expand content area)
    // (padTop, padRight, padBottom, padLeft already calculated in Step 2a)
    const paddedWidth = contentWidth + padLeft + padRight;

    // Get inner color codes for padding and content
    const innerOpen = this._buildInnerColorCodes('open');
    const innerClose = this._buildInnerColorCodes('close');

    // Add top padding lines
    const paddedLines = [];
    for (let i = 0; i < padTop; i++) {
      const blankLine = ' '.repeat(paddedWidth);
      paddedLines.push(innerOpen + blankLine + innerClose);
    }

    // Pad left and right of each content line
    for (const line of lines) {
      const paddedLine = ' '.repeat(padLeft) + line + ' '.repeat(padRight);
      const styledLine = innerOpen + this._reopenOnClose(paddedLine) + innerClose;
      paddedLines.push(styledLine);
    }

    // Add bottom padding lines
    for (let i = 0; i < padBottom; i++) {
      const blankLine = ' '.repeat(paddedWidth);
      paddedLines.push(innerOpen + blankLine + innerClose);
    }

    // Step 6: Content is already styled in Step 5 (no additional styling needed)
    const styledLines = paddedLines;

    // Step 7: Apply border (if set)
    let finalLines = styledLines;
    if (this._border !== null) {
      const borderWidth =
        paddedWidth +
        (this._border.sides.left ? 1 : 0) +
        (this._border.sides.right ? 1 : 0);

      // Build border color codes (if specified)
      const borderOpen = this._buildBorderColorCodes('open');
      const borderClose = this._buildBorderColorCodes('close');

      const { chars, sides } = this._border;

      // Build border rows
      const borderLines = [];

      // Top border (if enabled)
      if (sides.top) {
        let topBorder = '';
        if (sides.left) topBorder += borderOpen + chars.topLeft + borderClose;
        topBorder += borderOpen + chars.top.repeat(paddedWidth) + borderClose;
        if (sides.right) topBorder += borderOpen + chars.topRight + borderClose;
        borderLines.push(topBorder);
      }

      // Content lines with left/right borders
      for (const contentLine of finalLines) {
        let borderedLine = '';
        if (sides.left) {
          borderedLine += borderOpen + chars.left + borderClose;
        }
        borderedLine += contentLine;
        if (sides.right) {
          borderedLine += borderOpen + chars.right + borderClose;
        }
        borderLines.push(borderedLine);
      }

      // Bottom border (if enabled)
      if (sides.bottom) {
        let bottomBorder = '';
        if (sides.left) bottomBorder += borderOpen + chars.bottomLeft + borderClose;
        bottomBorder += borderOpen + chars.bottom.repeat(paddedWidth) + borderClose;
        if (sides.right)
          bottomBorder += borderOpen + chars.bottomRight + borderClose;
        borderLines.push(bottomBorder);
      }

      finalLines = borderLines;
    }

    // Step 8: Join lines and return
    return joinLines(finalLines);
  }

  /**
   * Build open/close codes for border foreground and background colors (if set).
   * If no border-specific colors, falls back to main foreground/background.
   * @private
   * @param {'open' | 'close'} mode
   * @returns {string}
   */
  _buildBorderColorCodes(mode) {
    const codes = [];
    const theme = this._theme || getTheme();

    if (mode === 'close') {
      if (this._borderForeground || this._foreground) {
        codes.push(sgr(39)); // reset foreground
      }
      if (this._borderBackground || this._background) {
        codes.push(sgr(49)); // reset background
      }
      return codes.join('');
    }

    // mode === 'open'
    // Use border-specific colors if set, otherwise fall back to main colors
    const fgSpec = this._borderForeground || this._foreground;
    const bgSpec = this._borderBackground || this._background;

    if (fgSpec) {
      if (fgSpec.type === 'semantic') {
        codes.push(theme.ansi(fgSpec.role, 'fg'));
      } else {
        const [r, g, b] = fgSpec.value;
        codes.push(fg(r, g, b));
      }
    }

    if (bgSpec) {
      if (bgSpec.type === 'semantic') {
        codes.push(theme.ansi(bgSpec.role, 'bg'));
      } else {
        const [r, g, b] = bgSpec.value;
        codes.push(bg(r, g, b));
      }
    }

    return codes.join('');
  }

  /**
   * Build open/close codes for inner (content/padding) colors.
   * Uses innerForeground/innerBackground if set, otherwise main foreground/background.
   * @private
   * @param {'open' | 'close'} mode
   * @returns {string}
   */
  _buildInnerColorCodes(mode) {
    const codes = [];
    const theme = this._theme || getTheme();

    if (mode === 'close') {
      if (this._innerForeground || this._foreground) {
        codes.push(sgr(39)); // reset foreground
      }
      if (this._innerBackground || this._background) {
        codes.push(sgr(49)); // reset background
      }
      return codes.join('');
    }

    // mode === 'open'
    const fgSpec = this._innerForeground || this._foreground;
    const bgSpec = this._innerBackground || this._background;

    if (fgSpec) {
      if (fgSpec.type === 'semantic') {
        codes.push(theme.ansi(fgSpec.role, 'fg'));
      } else {
        const [r, g, b] = fgSpec.value;
        codes.push(fg(r, g, b));
      }
    }

    if (bgSpec) {
      if (bgSpec.type === 'semantic') {
        codes.push(theme.ansi(bgSpec.role, 'bg'));
      } else {
        const [r, g, b] = bgSpec.value;
        codes.push(bg(r, g, b));
      }
    }

    return codes.join('');
  }
}
