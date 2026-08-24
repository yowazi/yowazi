#!/usr/bin/env bun
// @ts-check

/**
 * Keyboard Decode Analyzer
 *
 * Shows exactly what keyboard input produces:
 * - Raw bytes received from terminal
 * - Decoded key interpretation
 *
 * Run: bun run examples/04-decode-analyzer.js
 * Then press keys and watch the output
 * Press Ctrl+C to exit.
 */

import { createKeyDecoder } from '../src/input.js';

const decoder = createKeyDecoder();

// Enable raw mode
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
}

console.log('Keyboard Input Analyzer');
console.log('======================\n');
console.log('Type keys, arrow keys, function keys, etc.');
console.log('See what bytes they send and how they\'re decoded.\n');
console.log('Press Ctrl+C to exit.\n');

// Handle cleanup
process.on('exit', () => {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
});

process.stdin.on('data', (chunk) => {
  const events = decoder.push(chunk);

  events.forEach((event) => {
    if (event.key === 'ctrl-c') {
      console.log('\n✓ Ctrl+C detected - exiting\n');
      process.exit(0);
    }

    showEvent(event);
  });
});

/**
 * Show a single decoded event
 * @param {any} event
 */
function showEvent(event) {
  if (event.type === 'key') {
    const key = event.key;

    // Get example if available (but only if no modifiers)
    if (!event.ctrl && !event.alt) {
      const example = EXAMPLES[key];
      if (example) {
        console.log(`${example.icon} ${example.name}`);
        return;
      }
    }

    // Show with modifiers
    const modifier = event.ctrl ? ' [ctrl]' : event.alt ? ' [alt]' : '';
    console.log(`  Key: "${key}"${modifier}`);
  } else if (event.type === 'mouse') {
    console.log(`  🖱  Mouse: ${event.button} ${event.action} at (${event.x}, ${event.y})`);
  }
}

const EXAMPLES = {
  a: { icon: '  a', name: 'Letter a' },
  b: { icon: '  b', name: 'Letter b' },
  '1': { icon: '  1', name: 'Number 1' },
  ' ': { icon: '    ', name: 'Space' },
  'up': { icon: '  ↑', name: 'Up arrow (ESC[A)' },
  'down': { icon: '  ↓', name: 'Down arrow (ESC[B)' },
  'left': { icon: '  ←', name: 'Left arrow (ESC[D)' },
  'right': { icon: '  →', name: 'Right arrow (ESC[C)' },
  'tab': { icon: '  ⇥', name: 'Tab' },
  'enter': { icon: '  ⏎', name: 'Enter' },
  'backspace': { icon: '  ⌫', name: 'Backspace' },
  'delete': { icon: '  ⌦', name: 'Delete (ESC[3~)' },
  'home': { icon: '  ⤒', name: 'Home (ESC[H)' },
  'end': { icon: '  ⤓', name: 'End (ESC[F)' },
  'pageup': { icon: '  ⇞', name: 'Page Up (ESC[5~)' },
  'pagedown': { icon: '  ⇟', name: 'Page Down (ESC[6~)' },
  'f1': { icon: ' F₁', name: 'F1 (ESC[11~)' },
  'f2': { icon: ' F₂', name: 'F2 (ESC[12~)' },
  'f5': { icon: ' F₅', name: 'F5 (ESC[15~)' },
  'f12': { icon: 'F₁₂', name: 'F12 (ESC[24~)' },
  'ctrl-c': { icon: '  ✕', name: 'Ctrl+C (0x03)' },
  'ctrl-d': { icon: '  ⊘', name: 'Ctrl+D (0x04)' },
  'escape': { icon: '  ⎋', name: 'Escape (0x1B)' },
};
