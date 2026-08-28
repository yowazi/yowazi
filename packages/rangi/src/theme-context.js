// @ts-check

import { Theme } from './theme.js';
import darkData from './themes/dark.meta.json' with { type: 'json' };

/**
 * Global theme context. Holds the currently active theme,
 * used by Style when no per-style override is set.
 */
let currentTheme = new Theme(darkData);

/**
 * Get the current global theme.
 * @returns {Theme}
 */
export function getTheme() {
  return currentTheme;
}

/**
 * Set the global theme.
 * @param {Theme} theme
 */
export function setTheme(theme) {
  if (!(theme instanceof Theme)) {
    throw new Error('setTheme expects a Theme instance');
  }
  currentTheme = theme;
}
