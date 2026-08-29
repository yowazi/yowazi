#!/usr/bin/env bun
// @ts-check

/**
 * Example: Keyboard Input Decoder
 *
 * Demonstrates the createKeyDecoder() function by decoding
 * keyboard input from stdin.
 *
 * Run: bun examples/03-keyboard-input.js
 * Then type: a, 5, arrows, F1, Ctrl+C, emoji, etc.
 * Press Ctrl+C to exit.
 */

import { createKeyDecoder } from '../src/input.js';

const decoder = createKeyDecoder();

console.log('Keyboard Input Decoder Test');
console.log('===========================');
console.log('Type keys, arrows, function keys, etc.');
console.log('Press Ctrl+C to exit.\n');

// Enable raw mode for immediate key capture (only in TTY)
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
}

// Handle cleanup
process.on('exit', () => {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
});

// Listen for input data
process.stdin.on('data', (chunk) => {
  const events = decoder.push(chunk);

  events.forEach(event => {
    if (event.type === 'key') {
      if (event.key === 'ctrl-c') {
        console.log(`\n✓ Got Ctrl+C, exiting...`);
        process.exit(0);
      }
      console.log(`KEY: "${event.key}"${event.ctrl ? ' [ctrl]' : ''}${event.alt ? ' [alt]' : ''}`);
    } else if (event.type === 'mouse') {
      console.log(`MOUSE: ${event.button} ${event.action} at (${event.x}, ${event.y})`);
    }
  });
});
