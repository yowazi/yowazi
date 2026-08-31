// @ts-check

/**
 * @typedef TerminalCapabilities
 * @property {boolean} [bracketedPaste] - Enable bracketed paste mode
 * @property {boolean} [mouseReporting] - Enable SGR mouse reporting
 * @property {boolean} [focusEvents] - Enable focus event tracking
 * @property {boolean} [unicodeWidth] - Terminal supports Unicode width detection
 */

/**
 * @typedef ModeOptions
 * @property {TerminalCapabilities} [capabilities] - Which features to enable
 * @property {(size: {width: number, height: number}) => void} [onResize] - SIGWINCH handler
 * @property {(signal: string) => void} [onSignal] - Signal handler (SIGINT, SIGTERM, SIGTSTP)
 */

/**
 * Terminal mode and signal management.
 *
 * Handles:
 * - Raw mode setup/teardown
 * - Terminal capability negotiation (bracketed paste, mouse, focus events)
 * - Signal handlers (SIGWINCH for resize, SIGINT/SIGTERM/SIGTSTP for shutdown)
 * - Terminal state restoration on exit
 *
 * This is the bridge between the low-level terminal input (input.js) and
 * higher-level TUI frameworks. It ensures proper cleanup and state management.
 */

import { registerSignalHandler } from './signals.js';

const CAPABILITIES = {
  BRACKETED_PASTE_ENABLE: '\x1b[?2004h',
  BRACKETED_PASTE_DISABLE: '\x1b[?2004l',
  MOUSE_ENABLE: '\x1b[?1000h\x1b[?1006h\x1b[?1015h',  // X11 + SGR + URXVT modes
  MOUSE_DISABLE: '\x1b[?1000l\x1b[?1006l\x1b[?1015l',
  FOCUS_EVENTS_ENABLE: '\x1b[?1004h',
  FOCUS_EVENTS_DISABLE: '\x1b[?1004l',
};

let rawModeActive = false;
const unregisterHandlers = [];

/**
 * Enable raw mode on stdin and set up capabilities.
 *
 * Raw mode allows capturing individual keypresses, including special keys,
 * control codes, and escape sequences. Disables line buffering and echo.
 *
 * Also registers signal handlers for clean shutdown and emits resize events.
 *
 * @param {ModeOptions} [options]
 * @returns {boolean} true if raw mode was successfully enabled
 *
 * @example
 * import { setRawMode, setNormalMode } from './state.js';
 *
 * setRawMode({
 *   onResize: ({ width, height }) => {
 *     console.log(`Terminal resized to ${width}x${height}`);
 *   },
 *   onSignal: (signal) => {
 *     console.log(`Received ${signal}, cleaning up...`);
 *   }
 * });
 *
 * // ... handle input ...
 *
 * setNormalMode();
 */
export function setRawMode(options = {}) {
  if (!process.stdin.isTTY) {
    return false;
  }

  if (rawModeActive) {
    return true;
  }

  try {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    rawModeActive = true;

    // Enable capabilities (default: all enabled unless explicitly disabled)
    const caps = options.capabilities || {};
    if (caps.bracketedPaste !== false) {
      enableBracketedPaste();
    }
    if (caps.mouseReporting !== false) {
      enableMouseReporting();
    }
    if (caps.focusEvents !== false) {
      enableFocusEvents();
    }

    // Register signal handlers
    registerSignalHandlers(options.onResize, options.onSignal);

    return true;
  } catch (err) {
    console.error('[singi] Failed to set raw mode:', err);
    return false;
  }
}

/**
 * Restore normal mode on stdin and disable capabilities.
 *
 * Disables all terminal capabilities, removes signal handlers, and restores
 * normal terminal behavior (line buffering, echo, etc.).
 *
 * @returns {void}
 */
export function setNormalMode() {
  if (!rawModeActive) {
    return;
  }

  // Disable capabilities
  disableBracketedPaste();
  disableMouseReporting();
  disableFocusEvents();

  // Restore normal mode
  try {
    process.stdin.setRawMode(false);
  } catch (err) {
    // Might already be in normal mode
  }

  process.stdin.pause();
  deregisterSignalHandlers();

  rawModeActive = false;
}

/**
 * Check if raw mode is currently active.
 *
 * @returns {boolean}
 */
export function isRawMode() {
  return rawModeActive;
}

/**
 * Get the current terminal size.
 *
 * @returns {{ width: number, height: number }}
 */
export function getTerminalSize() {
  return {
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  };
}

// ============================================================
// Capability control
// ============================================================

/**
 * Enable bracketed paste mode.
 * Allows distinguishing pasted text from typed input.
 * @private
 */
function enableBracketedPaste() {
  try {
    process.stdout.write(CAPABILITIES.BRACKETED_PASTE_ENABLE);
  } catch (err) {
    // Silently fail if stdout is not available
  }
}

/**
 * Disable bracketed paste mode.
 * @private
 */
function disableBracketedPaste() {
  try {
    process.stdout.write(CAPABILITIES.BRACKETED_PASTE_DISABLE);
  } catch (err) {
    // Silently fail if stdout is not available
  }
}

/**
 * Enable SGR mouse reporting.
 * Allows tracking mouse clicks, movement, and wheel events.
 * @private
 */
function enableMouseReporting() {
  try {
    process.stdout.write(CAPABILITIES.MOUSE_ENABLE);
  } catch (err) {
    // Silently fail if stdout is not available
  }
}

/**
 * Disable SGR mouse reporting.
 * @private
 */
function disableMouseReporting() {
  try {
    process.stdout.write(CAPABILITIES.MOUSE_DISABLE);
  } catch (err) {
    // Silently fail if stdout is not available
  }
}

/**
 * Enable focus event tracking.
 * Allows knowing when the terminal window gains/loses focus.
 * @private
 */
function enableFocusEvents() {
  try {
    process.stdout.write(CAPABILITIES.FOCUS_EVENTS_ENABLE);
  } catch (err) {
    // Silently fail if stdout is not available
  }
}

/**
 * Disable focus event tracking.
 * @private
 */
function disableFocusEvents() {
  try {
    process.stdout.write(CAPABILITIES.FOCUS_EVENTS_DISABLE);
  } catch (err) {
    // Silently fail if stdout is not available
  }
}

// ============================================================
// Signal handling
// ============================================================

/**
 * Handle SIGWINCH (terminal resize).
 * @private
 */
function handleSigwinch(onResize) {
  if (onResize) {
    const size = getTerminalSize();
    onResize(size);
  }
}

/**
 * Handle SIGINT (Ctrl+C).
 * @private
 */
function handleSigint(onSignal) {
  setNormalMode();
  onSignal?.('SIGINT');
  process.exit(130); // 128 + SIGINT(2)
}

/**
 * Handle SIGTERM (termination signal).
 * @private
 */
function handleSigterm(onSignal) {
  setNormalMode();
  onSignal?.('SIGTERM');
  process.exit(143); // 128 + SIGTERM(15)
}

/**
 * Handle SIGTSTP (suspend - Ctrl+Z).
 * Restores terminal state before suspending so user can see shell.
 * @private
 */
function handleSigtstp(onSignal) {
  setNormalMode();
  onSignal?.('SIGTSTP');
  process.kill(process.pid, 'SIGSTOP');
}

/**
 * Register signal handlers for clean shutdown and resize events.
 * @private
 */
function registerSignalHandlers(onResize, onSignal) {
  // Register each signal handler via the signal registry
  unregisterHandlers.push(
    registerSignalHandler('SIGINT', () => handleSigint(onSignal)),
    registerSignalHandler('SIGTERM', () => handleSigterm(onSignal)),
    registerSignalHandler('SIGTSTP', () => handleSigtstp(onSignal)),
    registerSignalHandler('SIGWINCH', () => handleSigwinch(onResize))
  );
}

/**
 * Deregister all signal handlers.
 * @private
 */
function deregisterSignalHandlers() {
  unregisterHandlers.forEach(unregister => unregister());
  unregisterHandlers.length = 0;
}
