// @ts-check

import { fg, bg, sgr } from '@yowazi/singi';

/**
 * @typedef {object} ThemeData
 * @property {string} name - Theme name
 * @property {object} colors - Color role definitions
 * @property {object} colors.default - Default text and background
 * @property {[number, number, number] | null} colors.default.fg - Default foreground RGB (null = terminal default)
 * @property {[number, number, number] | null} colors.default.bg - Default background RGB (null = terminal default)
 * @property {object} colors.primary - Primary UI element colors
 * @property {[number, number, number] | null} colors.primary.fg - Primary foreground RGB (null = transparent)
 * @property {[number, number, number] | null} colors.primary.bg - Primary background RGB (null = transparent)
 * @property {object} colors.secondary - Secondary element colors
 * @property {object} colors.alert - Alert/important message colors
 * @property {object} colors.warning - Warning message colors
 * @property {object} colors.error - Error message colors
 */

/**
 * Theme represents a complete color scheme with semantic role definitions.
 * Each role has a foreground (fg) and background (bg) RGB color pair.
 *
 * The forward mapping (role → ANSI escape) is done via singi's color detection,
 * which means the escapes vary by terminal capability (TrueColor vs Ansi256 vs Ansi16).
 * The reverse map is built lazily and caches the exact escape strings singi produces.
 */
export class Theme {
  /**
   * @param {ThemeData} data
   */
  constructor(data) {
    this.name = data.name;
    this.colors = data.colors;

    // Validate structure
    const requiredRoles = ['default', 'primary', 'secondary', 'alert', 'warning', 'error'];
    for (const role of requiredRoles) {
      if (!this.colors[role]) {
        throw new Error(`Theme "${data.name}" missing required role: ${role}`);
      }
      const isValidColor = (c) => c === null || (Array.isArray(c) && c.length === 3);
      if (!isValidColor(this.colors[role].fg)) {
        throw new Error(`Theme "${data.name}" role "${role}" has invalid fg color (must be RGB array or null)`);
      }
      if (!isValidColor(this.colors[role].bg)) {
        throw new Error(`Theme "${data.name}" role "${role}" has invalid bg color (must be RGB array or null)`);
      }
    }

    /**
     * Lazy-built reverse lookup map: escape string → { role, channel }
     * @type {Map<string, { role: string, channel: string }} | null}
     */
    this._reverseLookupMap = null;
  }

  /**
   * Get the raw RGB triplet for a role/channel, or null if transparent.
   * @param {string} role - e.g. 'primary', 'error'
   * @param {'fg'|'bg'} channel - 'fg' or 'bg'
   * @returns {[number, number, number] | null} RGB triplet or null for transparent (terminal default)
   */
  rgb(role, channel) {
    const roleData = this.colors[role];
    if (!roleData) {
      throw new Error(`Unknown role: ${role}`);
    }
    if (channel !== 'fg' && channel !== 'bg') {
      throw new Error(`Unknown channel: ${channel}`);
    }
    return roleData[channel];
  }

  /**
   * Get the ANSI escape string for a role/channel.
   * For RGB colors, calls singi's fg()/bg() which detects terminal capability and produces
   * the appropriate escape sequence (TrueColor, Ansi256, Ansi16, or empty string).
   * For null (transparent), returns the reset code (sgr(39) for fg, sgr(49) for bg).
   *
   * @param {string} role - e.g. 'primary', 'error'
   * @param {'fg'|'bg'} channel - 'fg' or 'bg'
   * @returns {string} ANSI escape sequence, e.g. "\x1b[38;2;80;200;120m" or "\x1b[39m" (reset)
   */
  ansi(role, channel) {
    const color = this.rgb(role, channel);

    // If color is null, return the reset code for that channel
    if (color === null) {
      return channel === 'fg' ? sgr(39) : sgr(49);
    }

    // Otherwise use the RGB values
    const [r, g, b] = color;
    if (channel === 'fg') {
      return fg(r, g, b);
    } else {
      return bg(r, g, b);
    }
  }

  /**
   * Look up a role/channel from an escape fragment.
   * Builds the reverse map on first call, then returns cached results.
   * Returns null if the escape isn't one of this theme's known color codes.
   *
   * @param {string} escapeFragment - An ANSI escape string (with or without \x1b)
   * @returns {null | { role: string, channel: string }}
   */
  reverseLookup(escapeFragment) {
    if (!this._reverseLookupMap) {
      this._reverseLookupMap = new Map();
      const roles = ['default', 'primary', 'secondary', 'alert', 'warning', 'error'];
      for (const role of roles) {
        for (const channel of ['fg', 'bg']) {
          const escapeStr = this.ansi(role, channel);
          if (escapeStr) {
            this._reverseLookupMap.set(escapeStr, { role, channel });
          }
        }
      }
    }

    return this._reverseLookupMap.get(escapeFragment) || null;
  }
}
