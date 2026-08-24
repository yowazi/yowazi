// @ts-check

/**
 * Integration tests for state.js + input.js
 *
 * Tests that raw mode and input decoding work together in realistic scenarios
 */

import { describe, it, expect } from 'bun:test';
import { setRawMode, setNormalMode, isRawMode } from './state.js';
import { createKeyDecoder } from './input.js';

describe('mode + input - Integrated workflows', () => {
  it('simulates interactive application setup', () => {
    const decoder = createKeyDecoder();
    let resizeCount = 0;
    let signalCount = 0;

    // Setup: Enable raw mode with callbacks
    const rawSuccess = setRawMode({
      onResize: () => resizeCount++,
      onSignal: () => signalCount++,
    });

    if (process.stdin.isTTY) {
      expect(rawSuccess).toBe(true);
      expect(isRawMode()).toBe(true);
    }

    // Simulate resize event
    if (process.stdin.isTTY) {
      process.emit('SIGWINCH');
    }

    // Teardown
    setNormalMode();
    if (process.stdin.isTTY) {
      expect(isRawMode()).toBe(false);
    }
  });

  it('handles input stream in raw mode context', () => {
    const decoder = createKeyDecoder();
    const capturedEvents = [];

    // Simulate input that would come from raw mode stdin
    const inputSequence = Buffer.concat([
      Buffer.from('h'), // type 'h'
      Buffer.from([0x1b, 0x5b, 0x41]), // press up arrow
      Buffer.from('i'), // type 'i'
    ]);

    const events = decoder.push(inputSequence);

    expect(events.length).toBe(3);
    expect(events[0].key).toBe('h');
    expect(events[1].key).toBe('up');
    expect(events[2].key).toBe('i');
  });

  it('processes complex input with modifiers and escapes', () => {
    const decoder = createKeyDecoder();

    // Simulate: regular key, arrow with ctrl, paste, regular key
    const inputs = [
      Buffer.from('a'),
      Buffer.from([0x1b, 0x5b, 0x31, 0x3b, 0x35, 0x41]), // Ctrl+Up
      Buffer.concat([
        Buffer.from('\x1b[200~'),
        Buffer.from('pasted text'),
        Buffer.from('\x1b[201~'),
      ]),
      Buffer.from('b'),
    ];

    const allEvents = [];
    inputs.forEach(input => {
      allEvents.push(...decoder.push(input));
    });

    expect(allEvents.length).toBe(4);
    expect(allEvents[0]).toEqual({ type: 'key', key: 'a' });
    expect(allEvents[1]).toEqual({ type: 'key', key: 'up', ctrl: true });
    expect(allEvents[2]).toEqual({ type: 'paste', text: 'pasted text' });
    expect(allEvents[3]).toEqual({ type: 'key', key: 'b' });
  });

  it('handles rapid-fire input like terminal event loop', () => {
    const decoder = createKeyDecoder();
    const events = [];

    // Simulate rapid typing: typing "test" quickly
    'test'.split('').forEach(char => {
      events.push(...decoder.push(Buffer.from(char)));
    });

    expect(events.length).toBe(4);
    expect(events.map(e => e.key)).toEqual(['t', 'e', 's', 't']);
  });

  it('processes escape sequences from different terminal types', () => {
    const decoder = createKeyDecoder();

    const sequences = [
      { name: 'Arrow up', input: Buffer.from([0x1b, 0x5b, 0x41]), expected: 'up' },
      { name: 'F1', input: Buffer.from([0x1b, 0x4f, 0x50]), expected: 'f1' },
      { name: 'Delete', input: Buffer.from([0x1b, 0x5b, 0x33, 0x7e]), expected: 'delete' },
      { name: 'Page Up', input: Buffer.from([0x1b, 0x5b, 0x35, 0x7e]), expected: 'pageup' },
    ];

    sequences.forEach(({ name, input, expected }) => {
      const freshDecoder = createKeyDecoder();
      const [event] = freshDecoder.push(input);
      expect(event.key).toBe(expected);
    });
  });

  it('accumulates input across multiple data events', () => {
    const decoder = createKeyDecoder();
    const events = [];

    // Simulate stdin delivering data in small chunks
    const data = ['he', 'l', 'lo', ' ', 'world'];
    data.forEach(chunk => {
      events.push(...decoder.push(Buffer.from(chunk)));
    });

    expect(events.length).toBe(11); // 11 characters
    const keys = events.map(e => e.key).join('');
    expect(keys).toBe('hello world');
  });

  it('handles incomplete sequences across chunks correctly', () => {
    const decoder = createKeyDecoder();

    // Send escape sequence in parts
    let events = decoder.push(Buffer.from([0x1b])); // ESC
    expect(events.length).toBe(1); // Should emit escape immediately
    expect(events[0].key).toBe('escape');

    // Then start a new sequence
    events = decoder.push(Buffer.from([0x1b, 0x5b])); // ESC [
    expect(events.length).toBe(0); // Waiting for complete CSI

    events = decoder.push(Buffer.from([0x41])); // A
    expect(events.length).toBe(1); // Now complete: up arrow
    expect(events[0].key).toBe('up');
  });

  it('demonstrates a complete interactive session lifecycle', () => {
    const decoder = createKeyDecoder();
    const sessionEvents = [];

    // 1. User starts typing
    sessionEvents.push(...decoder.push(Buffer.from('name')));

    // 2. User presses enter
    sessionEvents.push(...decoder.push(Buffer.from([0x0d]))); // CR

    // 3. Paste some data
    sessionEvents.push(...decoder.push(Buffer.concat([
      Buffer.from('\x1b[200~'),
      Buffer.from('data'),
      Buffer.from('\x1b[201~'),
    ])));

    // 4. User presses tab to complete
    sessionEvents.push(...decoder.push(Buffer.from([0x09])));

    // 5. User quits
    sessionEvents.push(...decoder.push(Buffer.from([0x03]))); // Ctrl+C

    expect(sessionEvents.length).toBeGreaterThan(0);
    expect(sessionEvents[sessionEvents.length - 1].key).toBe('ctrl-c');
  });

  it('handles UTF-8 input in raw mode context', () => {
    const decoder = createKeyDecoder();

    // Simulate pasting emoji and CJK
    const utf8Input = Buffer.concat([
      Buffer.from('Hello '),
      Buffer.from('🪟', 'utf8'),
      Buffer.from(' '),
      Buffer.from('世界', 'utf8'),
    ]);

    const events = decoder.push(utf8Input);

    // Should correctly parse: H e l l o space emoji space 世 界 = 10 events
    expect(events.length).toBe(10);
    expect(events.find(e => e.key === '🪟')).toBeDefined();
    expect(events.find(e => e.key === '世')).toBeDefined();
    expect(events.find(e => e.key === '界')).toBeDefined();
  });

  it('verifies mode state during input processing', () => {
    // Start with normal mode
    expect(isRawMode()).toBe(false);

    // Enable raw mode
    if (process.stdin.isTTY) {
      setRawMode();
      expect(isRawMode()).toBe(true);

      // Process some input
      const decoder = createKeyDecoder();
      const events = decoder.push(Buffer.from('test'));
      expect(events.length).toBe(4);

      // Disable raw mode
      setNormalMode();
      expect(isRawMode()).toBe(false);
    }
  });
});
