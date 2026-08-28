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
import { getTheme } from './theme-context.js';

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
   * Returns open() + reopenOnClose(text) + close().
   *
   * @param {string} text
   * @returns {string}
   */
  render(text) {
    const prefix = this.open();
    const reopened = this._reopenOnClose(text);
    const suffix = this.close();
    return prefix + reopened + suffix;
  }
}
