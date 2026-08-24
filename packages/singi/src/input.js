// @ts-check

/**
 * @typedef KeyEvent
 * @property {'key'} type
 * @property {string} key - key name or character
 * @property {boolean} [ctrl] - Ctrl modifier
 * @property {boolean} [shift] - Shift modifier
 * @property {boolean} [alt] - Alt modifier
 */

/**
 * @typedef MouseEvent
 * @property {'mouse'} type
 * @property {number} x
 * @property {number} y
 * @property {string} button - 'left', 'middle', 'right', or 'scroll'
 * @property {string} action - 'press', 'release', 'up', or 'down'
 */

/**
 * @typedef PasteEvent
 * @property {'paste'} type
 * @property {string} text - Pasted text content
 */

/**
 * @typedef {KeyEvent | MouseEvent | PasteEvent} InputEvent
 *
 * Events emitted by the input decoder. Note: resize events (SIGWINCH)
 * are handled separately by state.js via the onResize callback, not the decoder.
 */

// ============================================================
// Constants - ANSI byte values and ranges
// ============================================================

const BYTE = {
  ESC: 0x1b,
  CSI_START: 0x5b,      // [
  SS3_START: 0x4f,      // O
  DEL: 0x7f,
  TAB: 0x09,
  ENTER_LF: 0x0a,       // \n
  ENTER_CR: 0x0d,       // \r
  BACKSPACE: 0x08,
  CTRL_C: 0x03,
  CTRL_D: 0x04,
  CTRL_Z: 0x1a,
  SEMICOLON: 0x3b,
  CSI_FINAL_ARROW_UP: 0x41,
  CSI_FINAL_ARROW_DOWN: 0x42,
  CSI_FINAL_ARROW_RIGHT: 0x43,
  CSI_FINAL_ARROW_LEFT: 0x44,
  CSI_FINAL_HOME: 0x48,
  CSI_FINAL_END: 0x46,
  CSI_FINAL_EXTENDED: 0x7e,
  CSI_FINAL_MOUSE: 0x4d,
  SS3_F1: 0x50,
  SS3_F2: 0x51,
  SS3_F3: 0x52,
  SS3_F4: 0x53,
};

// Bracketed paste sequences
const PASTE_START = '\x1b[200~';
const PASTE_END = '\x1b[201~';

// Extended key parameters (used in CSI ~ sequences)
const EXTENDED_KEYS = {
  3: 'delete',
  5: 'pageup',
  6: 'pagedown',
  11: 'f1', 12: 'f2', 13: 'f3', 14: 'f4', 15: 'f5',
  17: 'f6', 18: 'f7', 19: 'f8', 20: 'f9', 21: 'f10',
  23: 'f11', 24: 'f12',
};

// SS3 function key mappings
const SS3_KEYS = {
  [BYTE.SS3_F1]: 'f1',
  [BYTE.SS3_F2]: 'f2',
  [BYTE.SS3_F3]: 'f3',
  [BYTE.SS3_F4]: 'f4',
};

// Control code mappings
const CONTROL_KEYS = {
  0x00: 'ctrl-@',
  0x03: 'ctrl-c',
  0x04: 'ctrl-d',
  0x08: 'backspace',
  0x09: 'tab',
  0x0a: 'enter',
  0x0d: 'enter',
  0x1a: 'ctrl-z',
};

/**
 * Check if buffer contains paste start sequence at given position.
 * @private
 * @param {Uint8Array} buffer
 * @param {number} index
 * @returns {boolean}
 */
function isPasteStart(buffer, index) {
  // ESC[200~ = 0x1B 0x5B 0x32 0x30 0x30 0x7E
  return (
    index + 6 <= buffer.length &&
    buffer[index] === 0x1b &&
    buffer[index + 1] === 0x5b &&
    buffer[index + 2] === 0x32 &&
    buffer[index + 3] === 0x30 &&
    buffer[index + 4] === 0x30 &&
    buffer[index + 5] === 0x7e
  );
}

/**
 * Check if buffer contains paste end sequence at given position.
 * @private
 * @param {Uint8Array} buffer
 * @param {number} index
 * @returns {boolean}
 */
function isPasteEnd(buffer, index) {
  // ESC[201~ = 0x1B 0x5B 0x32 0x30 0x31 0x7E
  return (
    index + 6 <= buffer.length &&
    buffer[index] === 0x1b &&
    buffer[index + 1] === 0x5b &&
    buffer[index + 2] === 0x32 &&
    buffer[index + 3] === 0x30 &&
    buffer[index + 4] === 0x31 &&
    buffer[index + 5] === 0x7e
  );
}

/**
 * Create a stateful ANSI input sequence decoder.
 *
 * Converts raw byte sequences from stdin into structured input events.
 * Handles multi-byte UTF-8, ANSI escape sequences (CSI/SS3), bracketed paste, and partial chunks.
 *
 * Features:
 * - UTF-8 decoding (respects multi-byte characters)
 * - CSI sequences (arrows, Page Up/Down, F-keys)
 * - SS3 sequences (alternative function keys)
 * - Bracketed paste mode (detects pasted text)
 * - SGR mouse mode (button tracking + coordinates)
 * - Control codes (Ctrl+C, Ctrl+D, etc.)
 * - Alt key modifier support (ESC + character)
 * - Input modifiers (Ctrl, Shift, Alt combinations)
 *
 * @returns {{
 *   push: (chunk: Buffer | Uint8Array) => InputEvent[],
 *   flush: () => InputEvent[]
 * }}
 */
export function createKeyDecoder() {
  /** @type {Uint8Array} */
  let buffer = new Uint8Array(0);

  // Bracketed paste mode state
  let inPaste = false;
  let pasteBytes = [];

  /**
   * Process a chunk of raw bytes and return complete input events.
   * @param {Buffer | Uint8Array} chunk
   * @returns {InputEvent[]}
   */
  function push(chunk) {
    // Append to buffer
    const newBuffer = new Uint8Array(buffer.length + chunk.length);
    newBuffer.set(buffer);
    newBuffer.set(chunk, buffer.length);
    buffer = newBuffer;

    const events = [];
    let i = 0;

    while (i < buffer.length) {
      const byte = buffer[i];

      // In paste mode: accumulate bytes until paste end
      if (inPaste && byte !== BYTE.ESC) {
        pasteBytes.push(byte);
        i++;
        continue;
      }

      // ESC — start of control sequence, paste marker, or standalone key
      if (byte === BYTE.ESC) {
        // Check for bracketed paste sequences
        if (isPasteStart(buffer, i)) {
          inPaste = true;
          i += 6;
          continue;
        }

        if (isPasteEnd(buffer, i)) {
          inPaste = false;
          if (pasteBytes.length > 0) {
            try {
              const pasteText = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(pasteBytes));
              events.push({ type: 'paste', text: pasteText });
            } catch {
              // If UTF-8 decoding fails, use fallback
              const pasteText = String.fromCharCode(...pasteBytes);
              events.push({ type: 'paste', text: pasteText });
            }
            pasteBytes = [];
          }
          i += 6;
          continue;
        }

        // Lone ESC at end of buffer
        if (i + 1 >= buffer.length) {
          events.push({ type: 'key', key: 'escape' });
          i++;
          continue;
        }

        const next = buffer[i + 1];

        // CSI: ESC [
        if (next === BYTE.CSI_START) {
          const result = decodeCSI(buffer, i);
          if (result === null) break; // Incomplete
          const [event, consumed] = result;
          if (event) events.push(event);
          i += consumed;
          continue;
        }

        // SS3: ESC O
        if (next === BYTE.SS3_START) {
          const result = decodeSS3(buffer, i);
          if (result === null) break; // Incomplete
          const [event, consumed] = result;
          if (event) events.push(event);
          i += consumed;
          continue;
        }

        // ESC followed by something else (Alt key or UTF-8)
        if (i + 1 < buffer.length) {
          const nextByte = buffer[i + 1];

          // ESC followed by another ESC = standalone escape
          if (nextByte === BYTE.ESC) {
            events.push({ type: 'key', key: 'escape' });
            i++;
            continue;
          }

          if (nextByte < 0x80) {
            // ASCII: Alt + char
            events.push({
              type: 'key',
              key: String.fromCharCode(nextByte),
              alt: true,
            });
            i += 2;
            continue;
          } else {
            // Multi-byte UTF-8 after ESC
            const result = decodeUTF8(buffer, i + 1);
            if (result === null) break;
            const [char, consumed] = result;
            events.push({
              type: 'key',
              key: char,
              alt: true,
            });
            i += 1 + consumed;
            continue;
          }
        }
      }

      // C0 control codes (0x00-0x1f, excluding ESC)
      if (byte < 0x20) {
        const event = decodeControl(byte);
        if (event) events.push(event);
        i++;
        continue;
      }

      // DEL (0x7f)
      if (byte === BYTE.DEL) {
        events.push({ type: 'key', key: 'backspace' });
        i++;
        continue;
      }

      // UTF-8 (0x80+)
      if (byte >= 0x80) {
        const result = decodeUTF8(buffer, i);
        if (result === null) break; // Incomplete
        const [char, consumed] = result;
        events.push({ type: 'key', key: char });
        i += consumed;
        continue;
      }

      // ASCII printable (0x20-0x7e)
      events.push({ type: 'key', key: String.fromCharCode(byte) });
      i++;
    }

    buffer = buffer.slice(i);
    return events;
  }

  /**
   * Flush any remaining bytes in the buffer as events.
   * Call this when input is complete to get trailing bytes or incomplete sequences.
   * @returns {InputEvent[]}
   */
  function flush() {
    const events = [];

    if (buffer.length > 0) {
      // Treat remaining bytes as-is
      let i = 0;
      while (i < buffer.length) {
        const byte = buffer[i];
        if (byte === 0x1b) {
          events.push({ type: 'key', key: 'escape' });
        } else if (byte < 0x20) {
          const event = decodeControl(byte);
          if (event) events.push(event);
        } else if (byte === 0x7f) {
          events.push({ type: 'key', key: 'backspace' });
        } else {
          events.push({ type: 'key', key: String.fromCharCode(byte) });
        }
        i++;
      }
      buffer = new Uint8Array(0);
    }

    return events;
  }

  return { push, flush };
}

/**
 * Decode modifier code to individual modifier flags.
 * CSI sequences with modifiers use: ESC [ ... ; modifier letter
 * Modifier codes: 2=Shift, 3=Alt, 4=Shift+Alt, 5=Ctrl, 6=Shift+Ctrl, 7=Alt+Ctrl, 8=Shift+Alt+Ctrl
 * @private
 * @param {number} modifierCode
 * @returns {{ ctrl: boolean, shift: boolean, alt: boolean } | null}
 */
function decodeModifier(modifierCode) {
  if (!modifierCode) return null;

  // Modifier code encoding (1-based, so subtract 1)
  const code = modifierCode - 1;
  return {
    shift: (code & 1) !== 0,
    alt: (code & 2) !== 0,
    ctrl: (code & 4) !== 0,
  };
}

/**
 * Collect parameters from a CSI sequence.
 * @private
 * @param {Uint8Array} buffer
 * @param {number} startIndex
 * @returns {{ values: number[], endIndex: number } | null}
 */
function collectCSIParams(buffer, startIndex) {
  let i = startIndex;
  const params = [];
  let paramStr = '';

  while (i < buffer.length) {
    const byte = buffer[i];
    if (byte >= 0x30 && byte <= 0x39) {
      // Digit
      paramStr += String.fromCharCode(byte);
      i++;
    } else if (byte === BYTE.SEMICOLON) {
      // Semicolon
      params.push(paramStr ? parseInt(paramStr, 10) : 0);
      paramStr = '';
      i++;
    } else if (byte >= 0x20 && byte <= 0x2f) {
      // Intermediate bytes (?, <, etc.)
      i++;
    } else {
      // Final byte
      break;
    }
  }

  if (i >= buffer.length) {
    return null; // Incomplete sequence
  }

  if (paramStr) params.push(parseInt(paramStr, 10));

  return { values: params, endIndex: i };
}

/**
 * Decode a CSI sequence (ESC [ ... final).
 * @private
 * @param {Uint8Array} buffer
 * @param {number} startIndex
 * @returns {[InputEvent | null, number] | null} [event, bytesConsumed] or null if incomplete
 */
function decodeCSI(buffer, startIndex) {
  let i = startIndex + 2; // Skip ESC [
  const params = collectCSIParams(buffer, i);

  if (params === null) {
    return null; // Incomplete sequence
  }

  const { values, endIndex } = params;
  const finalByte = buffer[endIndex];
  const consumed = endIndex - startIndex + 1;

  // Extract modifier from parameters (typically second parameter, or last if multiple)
  // CSI sequences with modifiers: ESC [ param1 ; modifier final
  let modifierCode = null;
  if (values.length > 1) {
    modifierCode = values[values.length - 1];
  }
  const modifiers = decodeModifier(modifierCode) || {};

  // Simple arrow keys and navigation
  const simpleKeyMap = {
    [BYTE.CSI_FINAL_ARROW_UP]: 'up',
    [BYTE.CSI_FINAL_ARROW_DOWN]: 'down',
    [BYTE.CSI_FINAL_ARROW_RIGHT]: 'right',
    [BYTE.CSI_FINAL_ARROW_LEFT]: 'left',
    [BYTE.CSI_FINAL_HOME]: 'home',
    [BYTE.CSI_FINAL_END]: 'end',
  };

  if (simpleKeyMap[finalByte]) {
    const event = { type: 'key', key: simpleKeyMap[finalByte] };
    if (modifiers.shift) event.shift = true;
    if (modifiers.alt) event.alt = true;
    if (modifiers.ctrl) event.ctrl = true;
    return [event, consumed];
  }

  // Extended keys (Delete, Page Up/Down, F-keys)
  if (finalByte === BYTE.CSI_FINAL_EXTENDED) {
    const param = values[0] ?? 0;
    const key = EXTENDED_KEYS[param];
    if (key) {
      const event = { type: 'key', key };
      if (modifiers.shift) event.shift = true;
      if (modifiers.alt) event.alt = true;
      if (modifiers.ctrl) event.ctrl = true;
      return [event, consumed];
    }
  }

  // SGR mouse event (ESC[<btn;x;yM)
  if (finalByte === BYTE.CSI_FINAL_MOUSE && values.length >= 3) {
    const btn = values[0];
    const x = values[1] - 1; // Convert 1-indexed to 0-indexed
    const y = values[2] - 1;

    let buttonName, action;
    if (btn === 64) {
      buttonName = 'scroll';
      action = 'up';
    } else if (btn === 65) {
      buttonName = 'scroll';
      action = 'down';
    } else {
      const button = btn & 0x03;
      buttonName = button === 0 ? 'left' : button === 1 ? 'middle' : button === 2 ? 'right' : 'unknown';
      action = btn & 0x40 ? 'move' : btn & 0x20 ? 'release' : 'press';
    }

    return [
      {
        type: 'mouse',
        x,
        y,
        button: buttonName,
        action,
      },
      consumed,
    ];
  }

  // Unknown CSI sequence; skip it
  return [null, consumed];
}

/**
 * Decode an SS3 sequence (ESC O + char).
 * @private
 * @param {Uint8Array} buffer
 * @param {number} startIndex
 * @returns {[InputEvent | null, number] | null}
 */
function decodeSS3(buffer, startIndex) {
  if (startIndex + 2 >= buffer.length) {
    return null;
  }

  const finalByte = buffer[startIndex + 2];
  const consumed = 3;
  const key = SS3_KEYS[finalByte];

  return [key ? { type: 'key', key } : null, consumed];
}

/**
 * Decode UTF-8 multi-byte sequence.
 * @private
 * @param {Uint8Array} buffer
 * @param {number} startIndex
 * @returns {[string, number] | null} [character, bytesConsumed] or null if incomplete
 */
function decodeUTF8(buffer, startIndex) {
  const byte = buffer[startIndex];

  let len = 0;
  if ((byte & 0x80) === 0) len = 1; // ASCII
  else if ((byte & 0xe0) === 0xc0) len = 2; // 110xxxxx
  else if ((byte & 0xf0) === 0xe0) len = 3; // 1110xxxx
  else if ((byte & 0xf8) === 0xf0) len = 4; // 11110xxx
  else return null; // Invalid

  if (startIndex + len > buffer.length) {
    return null; // Incomplete
  }

  try {
    const bytes = buffer.slice(startIndex, startIndex + len);
    const char = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return [char, len];
  } catch {
    return null; // Invalid UTF-8
  }
}

/**
 * Decode C0 control codes (0x00-0x1f, excluding ESC).
 * @private
 * @param {number} byte
 * @returns {InputEvent | null}
 */
function decodeControl(byte) {
  // Check lookup table first
  if (CONTROL_KEYS[byte]) {
    return { type: 'key', key: CONTROL_KEYS[byte] };
  }

  // Ctrl+A through Ctrl+Z (generic, for unmapped keys)
  if (byte >= 0x01 && byte <= 0x1a) {
    const char = String.fromCharCode(0x61 + (byte - 1)); // 'a' = 0x61
    return { type: 'key', key: char, ctrl: true };
  }

  return null;
}
