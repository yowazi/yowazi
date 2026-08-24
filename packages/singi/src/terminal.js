// @ts-check

/**
 * Terminal utility functions.
 *
 * Low-level terminal control utilities.
 */

import {
  saveCursor,
  restoreCursor,
  altScreenEnable,
  altScreenDisable,
  hideCursor,
  showCursor,
  cursorPos,
  sgrReset,
  clearScreen,
} from './escapes.js';
import { registerSignalHandler } from './signals.js';

const write = (str) => process.stdout.write(str);

//*******************************************************************
// fullscreen handling
//*******************************************************************

let isFullscreen = false;
const unregisterHandlers = [];

/**
 * Fullscreen escape sequence.
 * @param {{hideCursor?: boolean}} [options]
 * @returns {void}
 */
function writeEnter(options = {}) {
  const cursorFunc = options.hideCursor ? hideCursor : showCursor;
  write(
    saveCursor() + 
    altScreenEnable() +
    cursorFunc() +
    cursorPos(1, 1)
  );
}

/**
 * Fullscreen disable sequence.
 * @returns {void}
 */
function writeExit() {
  write(
    sgrReset() +
    showCursor() +
    altScreenDisable() +
    restoreCursor()
  );
}

/**
 * Handle normal exit.
 * @returns {void}
 */
function handleExit() {
   exitFullscreen();
}


/**
 * Handle Sigint.
 * @returns {void}
 */
function handleSigint() {
   exitFullscreen();
   process.exit(130); // 128 + SIGINT(2)
}

/**
 * Handle Sigterm.
 * @returns {void}
 */
function handleSigterm() {
   exitFullscreen();
   process.exit(143); // 128 + SIGTERM(15)
}

/**
 * Handle uncaughtError.
 * @param {Error} err 
 * @returns {void}
 */
function handleUncaughtError(err) {
   exitFullscreen();
   console.error(err);
   process.exit(1);
}

/**
 * Enters terminal fullscreen.
 *
 * Also registers safety handlers for errors and kill signals
 * ensuring terminal restores properly. 
 *
 * Safely handles multiple invocations.
 *
 * @param {{hideCursor: boolean}} options
 * @returns {void}
 */
export function enterFullscreen(options) {
  if (isFullscreen) return;

  isFullscreen = true;
  writeEnter(options);

  // Register signal handlers via the signal registry
  unregisterHandlers.push(registerSignalHandler('exit', handleExit));
  unregisterHandlers.push(registerSignalHandler('SIGINT', handleSigint));
  unregisterHandlers.push(registerSignalHandler('SIGTERM', handleSigterm));
  unregisterHandlers.push(registerSignalHandler('uncaughtException', handleUncaughtError));
}

/**
 * Exits terminal fullscreen.
 *
 * Safely exits and deregisters process handlers.
 *
 * @returns {void}
 */
export function exitFullscreen() {
  if (!isFullscreen) return;

  isFullscreen = false;
  writeExit();

  // Unregister all signal handlers
  unregisterHandlers.forEach(unregister => unregister());
  unregisterHandlers.length = 0;
}

