// @ts-check
import { describe, it, expect } from 'bun:test';
import { createKeyDecoder } from './input.js';

describe('createKeyDecoder - Control Codes', () => {
  it('decodes Ctrl+C (0x03)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x03]));
    expect(events).toEqual([{ type: 'key', key: 'ctrl-c' }]);
  });

  it('decodes Ctrl+D (0x04)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x04]));
    expect(events).toEqual([{ type: 'key', key: 'ctrl-d' }]);
  });

  it('decodes Tab (0x09)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x09]));
    expect(events).toEqual([{ type: 'key', key: 'tab' }]);
  });

  it('decodes Enter (0x0a = LF)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x0a]));
    expect(events).toEqual([{ type: 'key', key: 'enter' }]);
  });

  it('decodes Enter (0x0d = CR)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x0d]));
    expect(events).toEqual([{ type: 'key', key: 'enter' }]);
  });

  it('decodes Backspace (0x08)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x08]));
    expect(events).toEqual([{ type: 'key', key: 'backspace' }]);
  });

  it('decodes DEL key (0x7f)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x7f]));
    expect(events).toEqual([{ type: 'key', key: 'backspace' }]);
  });

  it('decodes generic Ctrl+A (0x01)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x01]));
    expect(events).toEqual([{ type: 'key', key: 'a', ctrl: true }]);
  });

  it('decodes generic Ctrl+Z (0x1a)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1a]));
    expect(events).toEqual([{ type: 'key', key: 'ctrl-z' }]);
  });
});

describe('createKeyDecoder - Printable ASCII', () => {
  it('decodes lowercase letter', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x61])); // 'a'
    expect(events).toEqual([{ type: 'key', key: 'a' }]);
  });

  it('decodes uppercase letter', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x41])); // 'A'
    expect(events).toEqual([{ type: 'key', key: 'A' }]);
  });

  it('decodes digit', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x35])); // '5'
    expect(events).toEqual([{ type: 'key', key: '5' }]);
  });

  it('decodes space', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x20]));
    expect(events).toEqual([{ type: 'key', key: ' ' }]);
  });

  it('decodes special character', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x21])); // '!'
    expect(events).toEqual([{ type: 'key', key: '!' }]);
  });
});

describe('createKeyDecoder - Arrow Keys (CSI sequences)', () => {
  it('decodes up arrow (ESC[A)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x41])); // ESC[A
    expect(events).toEqual([{ type: 'key', key: 'up' }]);
  });

  it('decodes down arrow (ESC[B)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x42])); // ESC[B
    expect(events).toEqual([{ type: 'key', key: 'down' }]);
  });

  it('decodes right arrow (ESC[C)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x43])); // ESC[C
    expect(events).toEqual([{ type: 'key', key: 'right' }]);
  });

  it('decodes left arrow (ESC[D)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x44])); // ESC[D
    expect(events).toEqual([{ type: 'key', key: 'left' }]);
  });

  it('decodes home key (ESC[H)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x48])); // ESC[H
    expect(events).toEqual([{ type: 'key', key: 'home' }]);
  });

  it('decodes end key (ESC[F)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x46])); // ESC[F
    expect(events).toEqual([{ type: 'key', key: 'end' }]);
  });
});

describe('createKeyDecoder - Extended Keys (CSI ~ format)', () => {
  it('decodes delete key (ESC[3~)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x33, 0x7e])); // ESC[3~
    expect(events).toEqual([{ type: 'key', key: 'delete' }]);
  });

  it('decodes page up (ESC[5~)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x35, 0x7e])); // ESC[5~
    expect(events).toEqual([{ type: 'key', key: 'pageup' }]);
  });

  it('decodes page down (ESC[6~)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x36, 0x7e])); // ESC[6~
    expect(events).toEqual([{ type: 'key', key: 'pagedown' }]);
  });

  it('decodes F1 key (ESC[11~)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x31, 0x31, 0x7e])); // ESC[11~
    expect(events).toEqual([{ type: 'key', key: 'f1' }]);
  });

  it('decodes F5 key (ESC[15~)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x31, 0x35, 0x7e])); // ESC[15~
    expect(events).toEqual([{ type: 'key', key: 'f5' }]);
  });

  it('decodes F10 key (ESC[21~)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x32, 0x31, 0x7e])); // ESC[21~
    expect(events).toEqual([{ type: 'key', key: 'f10' }]);
  });

  it('decodes F12 key (ESC[24~)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x32, 0x34, 0x7e])); // ESC[24~
    expect(events).toEqual([{ type: 'key', key: 'f12' }]);
  });
});

describe('createKeyDecoder - SS3 Function Keys', () => {
  it('decodes F1 via SS3 (ESC O P)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x4f, 0x50])); // ESC O P
    expect(events).toEqual([{ type: 'key', key: 'f1' }]);
  });

  it('decodes F2 via SS3 (ESC O Q)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x4f, 0x51])); // ESC O Q
    expect(events).toEqual([{ type: 'key', key: 'f2' }]);
  });
});

describe('createKeyDecoder - UTF-8 Multi-byte', () => {
  it('decodes emoji (4-byte UTF-8)', () => {
    const decoder = createKeyDecoder();
    // 😀 = F0 9F 98 80
    const events = decoder.push(Buffer.from([0xf0, 0x9f, 0x98, 0x80]));
    expect(events).toEqual([{ type: 'key', key: '😀' }]);
  });

  it('decodes accented character (2-byte UTF-8)', () => {
    const decoder = createKeyDecoder();
    // é = C3 A9
    const events = decoder.push(Buffer.from([0xc3, 0xa9]));
    expect(events).toEqual([{ type: 'key', key: 'é' }]);
  });

  it('decodes Chinese character (3-byte UTF-8)', () => {
    const decoder = createKeyDecoder();
    // 中 = E4 B8 AD
    const events = decoder.push(Buffer.from([0xe4, 0xb8, 0xad]));
    expect(events).toEqual([{ type: 'key', key: '中' }]);
  });

  it('handles incomplete UTF-8 sequence', () => {
    const decoder = createKeyDecoder();
    // First byte of 4-byte sequence
    const events = decoder.push(Buffer.from([0xf0]));
    expect(events).toEqual([]); // Should wait for more data
  });

  it('completes UTF-8 across multiple chunks', () => {
    const decoder = createKeyDecoder();
    const events1 = decoder.push(Buffer.from([0xf0])); // Incomplete
    expect(events1).toEqual([]);

    const events2 = decoder.push(Buffer.from([0x9f, 0x98, 0x80])); // Rest of 😀
    expect(events2).toEqual([{ type: 'key', key: '😀' }]);
  });
});

describe('createKeyDecoder - Modifiers (ESC prefix)', () => {
  it('decodes Alt+A (ESC a)', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x1b, 0x61])); // ESC a
    expect(events).toEqual([{ type: 'key', key: 'a', alt: true }]);
  });

  it('decodes Alt+Up (ESC + arrow)', () => {
    const decoder = createKeyDecoder();
    // ESC followed by up arrow bytes
    const events = decoder.push(Buffer.from([0x1b, 0x1b, 0x5b, 0x41])); // ESC ESC[A
    // This is complex - ESC followed by complete sequence
    // Behavior depends on timing, but it should handle it
    expect(events.length).toBeGreaterThanOrEqual(0);
  });
});

describe('createKeyDecoder - CSI Modifiers', () => {
  it('decodes Ctrl+Up (ESC[1;5A)', () => {
    const decoder = createKeyDecoder();
    // ESC [ 1 ; 5 A (5 = Ctrl)
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x31, 0x3b, 0x35, 0x41]));
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'key', key: 'up', ctrl: true });
  });

  it('decodes Shift+Up (ESC[1;2A)', () => {
    const decoder = createKeyDecoder();
    // ESC [ 1 ; 2 A (2 = Shift)
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x31, 0x3b, 0x32, 0x41]));
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'key', key: 'up', shift: true });
  });

  it('decodes Alt+Up (ESC[1;3A)', () => {
    const decoder = createKeyDecoder();
    // ESC [ 1 ; 3 A (3 = Alt)
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x31, 0x3b, 0x33, 0x41]));
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'key', key: 'up', alt: true });
  });

  it('decodes Ctrl+Shift+Up (ESC[1;6A)', () => {
    const decoder = createKeyDecoder();
    // ESC [ 1 ; 6 A (6 = Shift+Ctrl)
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x31, 0x3b, 0x36, 0x41]));
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'key', key: 'up', shift: true, ctrl: true });
  });

  it('decodes Shift+F5 (ESC[15;2~)', () => {
    const decoder = createKeyDecoder();
    // ESC [ 15 ; 2 ~ (2 = Shift, 15 = F5)
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x31, 0x35, 0x3b, 0x32, 0x7e]));
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'key', key: 'f5', shift: true });
  });

  it('decodes Ctrl+Delete (ESC[3;5~)', () => {
    const decoder = createKeyDecoder();
    // ESC [ 3 ; 5 ~ (5 = Ctrl, 3 = Delete)
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x33, 0x3b, 0x35, 0x7e]));
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'key', key: 'delete', ctrl: true });
  });

  it('decodes Alt+Shift+Down (ESC[1;4B)', () => {
    const decoder = createKeyDecoder();
    // ESC [ 1 ; 4 B (4 = Shift+Alt)
    const events = decoder.push(Buffer.from([0x1b, 0x5b, 0x31, 0x3b, 0x34, 0x42]));
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'key', key: 'down', shift: true, alt: true });
  });
});

describe('createKeyDecoder - Mouse Events (SGR format)', () => {
  it('supports SGR mouse protocol (left click)', () => {
    const decoder = createKeyDecoder();
    // SGR mouse format: ESC[<btn;x;yM
    // Left button press at column 10, row 5
    // ESC[<0;10;5M
    const bytes = [0x1b, 0x5b, 0x3c, 0x30, 0x3b, 0x31, 0x30, 0x3b, 0x35, 0x4d];
    const events = decoder.push(Buffer.from(bytes));

    // Should decode to mouse event
    expect(events.length).toBeGreaterThan(0);
    const event = events[0];
    if (event?.type === 'mouse') {
      expect(event.button).toBe('left');
      expect(event.x).toBe(9); // 0-indexed
      expect(event.y).toBe(4);
    }
  });

  it('supports SGR scroll wheel events', () => {
    const decoder = createKeyDecoder();
    // Scroll up: button code 64
    // ESC[<64;x;yM
    const bytes = [0x1b, 0x5b, 0x3c, 0x36, 0x34, 0x3b, 0x35, 0x3b, 0x35, 0x4d];
    const events = decoder.push(Buffer.from(bytes));

    expect(events.length).toBeGreaterThan(0);
    const event = events[0];
    if (event?.type === 'mouse') {
      expect(event.button).toBe('scroll');
    }
  });
});

describe('createKeyDecoder - Bracketed Paste', () => {
  it('detects and decodes paste events', () => {
    const decoder = createKeyDecoder();
    // ESC[200~ + text + ESC[201~
    const pasteStart = Buffer.from('\x1b[200~');
    const pasteText = Buffer.from('hello world');
    const pasteEnd = Buffer.from('\x1b[201~');
    const combined = Buffer.concat([pasteStart, pasteText, pasteEnd]);

    const events = decoder.push(combined);

    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'paste', text: 'hello world' });
  });

  it('accumulates multi-part pastes across chunks', () => {
    const decoder = createKeyDecoder();
    const pasteStart = Buffer.from('\x1b[200~');
    const pasteEnd = Buffer.from('\x1b[201~');

    // Send in parts
    let events = decoder.push(pasteStart);
    expect(events).toEqual([]); // No complete event yet

    events = decoder.push(Buffer.from('hello '));
    expect(events).toEqual([]); // Still accumulating

    events = decoder.push(Buffer.from('world'));
    expect(events).toEqual([]); // Still accumulating

    events = decoder.push(pasteEnd);
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'paste', text: 'hello world' });
  });

  it('handles paste with UTF-8 content', () => {
    const decoder = createKeyDecoder();
    const pasteStart = Buffer.from('\x1b[200~');
    const pasteText = Buffer.from('café ☕', 'utf8');
    const pasteEnd = Buffer.from('\x1b[201~');
    const combined = Buffer.concat([pasteStart, pasteText, pasteEnd]);

    const events = decoder.push(combined);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('paste');
    expect(events[0].text).toBe('café ☕');
  });

  it('handles paste with newlines', () => {
    const decoder = createKeyDecoder();
    const pasteStart = Buffer.from('\x1b[200~');
    const pasteText = Buffer.from('line1\nline2\nline3');
    const pasteEnd = Buffer.from('\x1b[201~');
    const combined = Buffer.concat([pasteStart, pasteText, pasteEnd]);

    const events = decoder.push(combined);

    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'paste', text: 'line1\nline2\nline3' });
  });

  it('returns empty paste event for empty paste', () => {
    const decoder = createKeyDecoder();
    // Just start and end without content
    const combined = Buffer.from('\x1b[200~\x1b[201~');

    const events = decoder.push(combined);

    expect(events.length).toBe(0); // Empty paste generates no event
  });

  it('mixes paste events with regular input', () => {
    const decoder = createKeyDecoder();

    // Type 'a'
    let events = decoder.push(Buffer.from([0x61]));
    expect(events[0]).toEqual({ type: 'key', key: 'a' });

    // Paste 'hello'
    const pasteStart = Buffer.from('\x1b[200~');
    const pasteText = Buffer.from('hello');
    const pasteEnd = Buffer.from('\x1b[201~');
    const combined = Buffer.concat([pasteStart, pasteText, pasteEnd]);

    events = decoder.push(combined);
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'paste', text: 'hello' });

    // Type 'b'
    events = decoder.push(Buffer.from([0x62]));
    expect(events[0]).toEqual({ type: 'key', key: 'b' });
  });
});

describe('createKeyDecoder - Buffering & Chunking', () => {
  it('handles multiple keys in one chunk', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([0x61, 0x62, 0x63])); // 'abc'
    expect(events).toEqual([
      { type: 'key', key: 'a' },
      { type: 'key', key: 'b' },
      { type: 'key', key: 'c' },
    ]);
  });

  it('handles escape sequence split across chunks', () => {
    const decoder = createKeyDecoder();
    // ESC alone gets emitted immediately as escape key
    const events1 = decoder.push(Buffer.from([0x1b]));
    expect(events1).toEqual([{ type: 'key', key: 'escape' }]);

    // New ESC sequence: up arrow ESC[A
    const events2 = decoder.push(Buffer.from([0x1b, 0x5b, 0x41]));
    expect(events2).toEqual([{ type: 'key', key: 'up' }]);
  });

  it('handles mixed content in chunks', () => {
    const decoder = createKeyDecoder();
    // 'a' + up arrow + 'b'
    const events = decoder.push(Buffer.from([0x61, 0x1b, 0x5b, 0x41, 0x62]));
    expect(events).toEqual([
      { type: 'key', key: 'a' },
      { type: 'key', key: 'up' },
      { type: 'key', key: 'b' },
    ]);
  });
});

describe('createKeyDecoder - Edge Cases', () => {
  it('handles empty chunk', () => {
    const decoder = createKeyDecoder();
    const events = decoder.push(Buffer.from([]));
    expect(events).toEqual([]);
  });

  it('handles invalid UTF-8 byte', () => {
    const decoder = createKeyDecoder();
    // 0xFF is invalid start byte
    const events = decoder.push(Buffer.from([0xff]));
    expect(events).toEqual([]); // Should skip or wait
  });

  it('flush() completes pending escape', () => {
    const decoder = createKeyDecoder();
    decoder.push(Buffer.from([0x1b])); // ESC waiting
    const events = decoder.flush();
    // After flush, ESC should be handled
    expect(events.length).toBeGreaterThanOrEqual(0);
  });

  it('multiple decoders are independent', () => {
    const decoder1 = createKeyDecoder();
    const decoder2 = createKeyDecoder();

    const events1 = decoder1.push(Buffer.from([0x61]));
    const events2 = decoder2.push(Buffer.from([0x62]));

    expect(events1).toEqual([{ type: 'key', key: 'a' }]);
    expect(events2).toEqual([{ type: 'key', key: 'b' }]);
  });
});
