// @ts-check

/**
 * @yowazi/singi - ANSI/terminal primitives
 *
 * Exports low-level terminal control utilities.
 */

export { 
  getTerminalSize, 
  enterFullscreen,
  exitFullscreen,
} from './terminal.js';

export {
  cursorPos,
  cursorUp,
  cursorDown,
  cursorRight,
  cursorLeft,
  hideCursor,
  showCursor,
  saveCursor,
  restoreCursor,
  eraseToEndOfLine,
  eraseLine,
  eraseToEndOfScreen,
  clearScreen,
  altScreenEnable,
  altScreenDisable,
  sgr,
  sgrReset,
  bold,
  noBold,
  dim,
  noDim,
  italic,
  noItalic,
  underline,
  noUnderline,
  blink,
  noBlink,
  invert,
  noInvert,
  strike,
  noStrike,
  stripAnsi,
} from './escapes.js';

