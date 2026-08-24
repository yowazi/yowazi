// @ts-check

/**
 * Integration tests for key decoder
 *
 * Tests the decoder with realistic input scenarios,
 * including partial sequences, chunked data, and real escape codes.
 */

import { describe, it, expect } from 'bun:test';
import { createKeyDecoder } from './input.js';

describe('createKeyDecoder - Integration Tests', () => {
  it('decodes a complete sequence piped as one chunk', () => {
    const decoder = createKeyDecoder();
    // Simulate: type "hi", press enter
    const input = Buffer.from([0x68, 0x69, 0x0a]); // 'h', 'i', enter
    const events = decoder.push(input);

    expect(events).toEqual([
      { type: 'key', key: 'h' },
      { type: 'key', key: 'i' },
      { type: 'key', key: 'enter' },
    ]);
  });

  it('handles real UTF-8 emoji in input', () => {
    const decoder = createKeyDecoder();
    // UTF-8 for 😀: F0 9F 98 80
    const input = Buffer.from('😀', 'utf8');
    const events = decoder.push(input);

    expect(events).toEqual([{ type: 'key', key: '😀' }]);
  });

  it('handles mixed ASCII and escape sequences', () => {
    const decoder = createKeyDecoder();
    // Simulate: type "a", press up, type "b"
    const input = Buffer.concat([
      Buffer.from([0x61]), // 'a'
      Buffer.from([0x1b, 0x5b, 0x41]), // ESC[A (up)
      Buffer.from([0x62]), // 'b'
    ]);

    const events = decoder.push(input);

    expect(events).toEqual([
      { type: 'key', key: 'a' },
      { type: 'key', key: 'up' },
      { type: 'key', key: 'b' },
    ]);
  });

  it('handles input split across multiple chunks', () => {
    const decoder = createKeyDecoder();

    // Chunk 1: Start of an escape sequence
    const events1 = decoder.push(Buffer.from([0x1b, 0x5b])); // ESC[
    expect(events1).toEqual([]); // Incomplete

    // Chunk 2: Complete the sequence
    const events2 = decoder.push(Buffer.from([0x41])); // A
    expect(events2).toEqual([{ type: 'key', key: 'up' }]);
  });

  it('handles very small chunks (byte-by-byte)', () => {
    const decoder = createKeyDecoder();
    const keys = [];

    // Send 'hello' one byte at a time
    'hello'.split('').forEach(char => {
      const events = decoder.push(Buffer.from(char, 'utf8'));
      keys.push(...events);
    });

    expect(keys.map(e => e.key)).toEqual(['h', 'e', 'l', 'l', 'o']);
  });

  it('handles rapid sequence of keys', () => {
    const decoder = createKeyDecoder();
    // Simulate rapid typing: press up, down, left, right
    const input = Buffer.from([
      0x1b, 0x5b, 0x41, // up
      0x1b, 0x5b, 0x42, // down
      0x1b, 0x5b, 0x44, // left
      0x1b, 0x5b, 0x43, // right
    ]);

    const events = decoder.push(input);

    expect(events).toEqual([
      { type: 'key', key: 'up' },
      { type: 'key', key: 'down' },
      { type: 'key', key: 'left' },
      { type: 'key', key: 'right' },
    ]);
  });

  it('handles function keys in sequence', () => {
    const decoder = createKeyDecoder();
    // Press F1, F5, F12
    const input = Buffer.from([
      0x1b, 0x5b, 0x31, 0x31, 0x7e, // F1
      0x1b, 0x5b, 0x31, 0x35, 0x7e, // F5
      0x1b, 0x5b, 0x32, 0x34, 0x7e, // F12
    ]);

    const events = decoder.push(input);

    expect(events).toEqual([
      { type: 'key', key: 'f1' },
      { type: 'key', key: 'f5' },
      { type: 'key', key: 'f12' },
    ]);
  });

  it('handles text entry with special keys', () => {
    const decoder = createKeyDecoder();
    // Simulate: "hello" + backspace + enter
    const input = Buffer.from([
      0x68, 0x65, 0x6c, 0x6c, 0x6f, // hello
      0x7f, // delete/backspace
      0x0a, // enter
    ]);

    const events = decoder.push(input);

    expect(events.map(e => e.key)).toEqual([
      'h', 'e', 'l', 'l', 'o', 'backspace', 'enter',
    ]);
  });

  it('handles Ctrl combinations', () => {
    const decoder = createKeyDecoder();
    // Ctrl+A, Ctrl+C, Ctrl+D
    const input = Buffer.from([0x01, 0x03, 0x04]);

    const events = decoder.push(input);

    expect(events).toEqual([
      { type: 'key', key: 'a', ctrl: true },
      { type: 'key', key: 'ctrl-c' },
      { type: 'key', key: 'ctrl-d' },
    ]);
  });

  it('handles Alt key combinations', () => {
    const decoder = createKeyDecoder();
    // Alt+h (ESC h)
    const input = Buffer.from([0x1b, 0x68]);

    const events = decoder.push(input);

    expect(events).toEqual([{ type: 'key', key: 'h', alt: true }]);
  });

  it('handles Tab and Enter', () => {
    const decoder = createKeyDecoder();
    // Tab + text + Enter
    const input = Buffer.from([0x09, 0x74, 0x65, 0x78, 0x74, 0x0a]);

    const events = decoder.push(input);

    expect(events.map(e => e.key)).toEqual(['tab', 't', 'e', 'x', 't', 'enter']);
  });

  it('handles multiple independent decoders correctly', () => {
    const decoder1 = createKeyDecoder();
    const decoder2 = createKeyDecoder();

    const input1 = Buffer.from([0x61, 0x62]); // 'ab'
    const input2 = Buffer.from([0x31, 0x32]); // '12'

    const events1 = decoder1.push(input1);
    const events2 = decoder2.push(input2);

    expect(events1.map(e => e.key)).toEqual(['a', 'b']);
    expect(events2.map(e => e.key)).toEqual(['1', '2']);
  });

  it('emits escape key immediately when alone', () => {
    const decoder = createKeyDecoder();
    // Push just ESC without following bytes
    const events = decoder.push(Buffer.from([0x1b]));

    // Should emit escape immediately
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('key');
    expect(events[0].key).toBe('escape');
  });

  it('handles large input efficiently', () => {
    const decoder = createKeyDecoder();

    // Create a large input (1000 characters)
    const largeInput = Buffer.alloc(1000);
    for (let i = 0; i < 1000; i++) {
      largeInput[i] = 0x61 + (i % 26); // Cycling through 'a' to 'z'
    }

    const events = decoder.push(largeInput);

    expect(events.length).toBe(1000);
    expect(events[0].key).toBe('a');
  });

  it('preserves correct order of mixed event types', () => {
    const decoder = createKeyDecoder();

    // Mix of keys, escapes, and control codes
    const input = Buffer.from([
      0x61, // 'a'
      0x09, // tab
      0x1b, 0x5b, 0x41, // up
      0x03, // ctrl-c
      0x62, // 'b'
    ]);

    const events = decoder.push(input);

    expect(events.map(e => e.key)).toEqual(['a', 'tab', 'up', 'ctrl-c', 'b']);
  });

  it('handles bracketed paste with simple text', () => {
    const decoder = createKeyDecoder();
    const input = Buffer.concat([
      Buffer.from('\x1b[200~'), // Paste start
      Buffer.from('hello world'),
      Buffer.from('\x1b[201~'), // Paste end
    ]);

    const events = decoder.push(input);

    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'paste', text: 'hello world' });
  });

  it('handles bracketed paste split across chunks', () => {
    const decoder = createKeyDecoder();

    let events = decoder.push(Buffer.from('\x1b[200~'));
    expect(events).toEqual([]); // Paste started, no event yet

    events = decoder.push(Buffer.from('hel'));
    expect(events).toEqual([]); // Still accumulating

    events = decoder.push(Buffer.from('lo '));
    expect(events).toEqual([]); // Still accumulating

    events = decoder.push(Buffer.from('world\x1b[201~'));
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'paste', text: 'hello world' });
  });

  it('handles bracketed paste with UTF-8 content', () => {
    const decoder = createKeyDecoder();
    const input = Buffer.concat([
      Buffer.from('\x1b[200~'),
      Buffer.from('café ☕', 'utf8'),
      Buffer.from('\x1b[201~'),
    ]);

    const events = decoder.push(input);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('paste');
    expect(events[0].text).toBe('café ☕');
  });

  it('handles bracketed paste with newlines', () => {
    const decoder = createKeyDecoder();
    const input = Buffer.concat([
      Buffer.from('\x1b[200~'),
      Buffer.from('line1\nline2\nline3'),
      Buffer.from('\x1b[201~'),
    ]);

    const events = decoder.push(input);

    expect(events.length).toBe(1);
    expect(events[0]).toEqual({
      type: 'paste',
      text: 'line1\nline2\nline3',
    });
  });

  it('handles mixed input with paste events', () => {
    const decoder = createKeyDecoder();

    // Regular key
    let events = decoder.push(Buffer.from('a'));
    expect(events[0]).toEqual({ type: 'key', key: 'a' });

    // Paste event
    events = decoder.push(Buffer.concat([
      Buffer.from('\x1b[200~'),
      Buffer.from('pasted'),
      Buffer.from('\x1b[201~'),
    ]));
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ type: 'paste', text: 'pasted' });

    // Another regular key
    events = decoder.push(Buffer.from('b'));
    expect(events[0]).toEqual({ type: 'key', key: 'b' });
  });

  it('handles paste with emoji', () => {
    const decoder = createKeyDecoder();
    const input = Buffer.concat([
      Buffer.from('\x1b[200~'),
      Buffer.from('🪟 Windows 🪟', 'utf8'),
      Buffer.from('\x1b[201~'),
    ]);

    const events = decoder.push(input);

    expect(events.length).toBe(1);
    expect(events[0]).toEqual({
      type: 'paste',
      text: '🪟 Windows 🪟',
    });
  });

  it('handles multiple consecutive pastes', () => {
    const decoder = createKeyDecoder();

    // First paste
    let events = decoder.push(Buffer.concat([
      Buffer.from('\x1b[200~'),
      Buffer.from('first'),
      Buffer.from('\x1b[201~'),
    ]));
    expect(events[0]).toEqual({ type: 'paste', text: 'first' });

    // Second paste
    events = decoder.push(Buffer.concat([
      Buffer.from('\x1b[200~'),
      Buffer.from('second'),
      Buffer.from('\x1b[201~'),
    ]));
    expect(events[0]).toEqual({ type: 'paste', text: 'second' });
  });
});
