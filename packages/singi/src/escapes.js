// @ts-check

/**
 * ANSI escape sequence primatives and low-level terminal control.
 */

/** Control Sequence Introducer prefix: ESC [ */
export const CSI = '\x1b[';

/** Operating System Command prefix: ESC ] */
export const OSC = '\x1b]';

// ============================================================
// cursor controls 
// ============================================================

/**
 * Move cursor to absolute position (1-indexed)
 * @param {number} row
 * @param {number} col
 * @returns {string}
 */
export function cursorPos(row, col) {
  return `${CSI}${row};${col}H`;
}

/**
 * Move cusror up by n lines.
 * @param {number} [n=1]
 * @returns {string}
 */
export function cursorUp(n = 1) {
  return `${CSI}${n}A`;
}

/**
 * Move cusror down by n lines.
 * @param {number} [n=1]
 * @returns {string}
 */
export function cursorDown(n = 1) {
  return `${CSI}${n}B`;
}

/**
 * Move cusror right by n columns.
 * @param {number} [n=1]
 * @returns {string}
 */
export function cursorRight(n = 1) {
  return `${CSI}${n}C`;
}

/**
 * Move cusror left by n columns.
 * @param {number} [n=1]
 * @returns {string}
 */
export function cursorLeft(n = 1) {
  return `${CSI}${n}D`;
}

/**
 * Hide cursor.
 * @returns {string}
 */
export function hideCursor() {
  return `${CSI}?25l`;
}

/** 
 * Show cursor.
 * @returns {string}
 */
export function showCursor() {
  return `${CSI}?25h`;
}

/** 
 * Save cursor and attributes.
 * @returns {string}
 */
export function saveCursor() {
  return `${CSI}s`;
}

/** 
 * Resrtore cursor and attributes.
 * @returns {string}
 */
export function restoreCursor() {
  return `${CSI}u`;
}



// ============================================================
// screen buffers and erasing
// ============================================================

/**
 * Erase from cursor to end of line.
 * @returns {string}
 */
export function eraseToEndOfLine() {
  return `${CSI}K`;
}

/**
 * Erase entire line line.
 * @returns {string}
 */
export function eraseLine() {
  return `${CSI}2K`;
}

/**
 * Erase from cursor to end of screen.
 * @returns {string}
 */
export function eraseToEndOfScreen() {
  return `${CSI}J`;
}

/**
 * Erase entire display buffer.
 * @returns {string}
 */
export function clearScreen() {
  return `${CSI}2J`;
}

/**
 * Enter alternate screen buffer (full-screen mode).
 * @returns {string}
 */
export function altScreenEnable() {
  return `${CSI}?1049h`;
}

/**
 * Exit alternate screen buffers.
 * @returns {string}
 */
export function altScreenDisable() {
  return `${CSI}?1049l`;
}

// =============================================================
// text attributes and SGR (select graphic rendition) primitives
// =============================================================

/**
 * Construct raw SGR escape sequence.
 * @param {...(string|number)} params
 * @returns {string}
 */
export function sgr(...params) {
  return `${CSI}${params.join(';')}m`;
}

/** Reset SGR */
export function sgrReset() {
  return sgr(0);
}

/** Enable bold */
export function bold() {
  return sgr(1);
}

/** Disable bold */
export function noBold() {
  return sgr(22);
}

/** Enable dim */
export function dim() {
  return sgr(2);
}

/** Disable dim */
export function noDim() {
  return sgr(22); // same as noBold.
}

/** Enable italic */
export function italic() {
  return sgr(3);
}

/** Disable italic */
export function noItalic() {
  return sgr(23);
}

/** Enable underline */
export function underline() {
  return sgr(4);
}

/** Disable underline */
export function noUnderline() {
  return sgr(24);
}

/** Enable blinking */
export function blink() {
  return sgr(5);
}

/** Disable blinking */
export function noBlink() {
  return sgr(25);
}

/** Enable inverted */
export function invert() {
  return sgr(7);
}

/** Disable inverted */
export function noInvert() {
  return sgr(27);
}

/** Enable strikethrough */
export function strike() {
  return sgr(9);
}

/** Disable strikethrough */
export function noStrike() {
  return sgr(29);
}

// =============================================================
// utilities
// =============================================================

/**
 * Strip all ANSI escape sequences from a string.
 * @param {string} str
 * @returns {string}
 */
export function stripAnsi(str) {
  return str.replace(
    /(?:\x1b\[[\d;]*[a-zA-Z]|\x1b\].*?(?:\x1b\\|\x07)|\x1b[PX^_].*?\x1b\\|\x1b[@-_])/g,
    ''
  )
}
