#!/usr/bin/env bun
// @ts-check

/**
 * Example: Raw Mode with Input Decoding
 *
 * Demonstrates how to use setRawMode() with createKeyDecoder() to build
 * a responsive, full-control terminal application.
 *
 * This example:
 * - Enables raw mode for immediate key capture
 * - Handles terminal resize (SIGWINCH)
 * - Handles graceful shutdown (SIGINT/SIGTERM)
 * - Decodes keyboard input into structured events
 * - Displays terminal dimensions and key events
 *
 * Run: bun run examples/05-raw-mode-input.js
 * Press arrow keys, function keys, Ctrl+C to exit.
 */

import { setRawMode, setNormalMode, getTerminalSize } from '../src/mode.js';
import { createKeyDecoder } from '../src/input.js';
import {
  clearScreen,
  cursorPos,
  hideCursor,
  showCursor,
  bold,
  noBold,
} from '../src/escapes.js';

const decoder = createKeyDecoder();
let lastSize = getTerminalSize();
let eventCount = 0;

// Setup: enter raw mode with signal handlers
const modeSetup = setRawMode({
  onResize: (size) => {
    lastSize = size;
    render();
  },
  onSignal: (signal) => {
    console.log(`\n✓ ${signal} received, shutting down...\n`);
    process.exit(0);
  },
});

if (!modeSetup) {
  console.error('Failed to set raw mode. Is this a TTY?');
  process.exit(1);
}

// Hide cursor while in raw mode
process.stdout.write(hideCursor());

// Initial render
render();

// Handle stdin input
process.stdin.on('data', (chunk) => {
  const events = decoder.push(chunk);

  events.forEach((event) => {
    eventCount++;

    if (event.type === 'key') {
      const key = event.key;

      // Exit on Escape (or show it)
      if (key === 'escape') {
        console.log('\n✓ Escape pressed, exiting...\n');
        cleanup();
        process.exit(0);
      }
    }

    render();
  });
});

// Handle cleanup on exit
process.on('exit', cleanup);

function cleanup() {
  process.stdout.write(showCursor());
  setNormalMode();
}

function render() {
  const size = getTerminalSize();
  const width = size.width;
  const height = size.height;

  // Clear screen and position cursor
  process.stdout.write(clearScreen() + cursorPos(1, 1));

  // Header
  process.stdout.write(`${bold()}Raw Mode + Input Decoding${noBold()}\n`);
  process.stdout.write('═'.repeat(width - 1) + '\n\n');

  // Terminal info
  process.stdout.write(
    `Terminal Size: ${width} columns × ${height} rows\n`
  );
  process.stdout.write(`Events Received: ${eventCount}\n`);
  process.stdout.write(`\n`);

  // Instructions
  process.stdout.write('Press any key to see it decoded:\n');
  process.stdout.write('  • Arrow keys, function keys\n');
  process.stdout.write('  • Ctrl+X combinations\n');
  process.stdout.write('  • Alt+X combinations\n');
  process.stdout.write('  • UTF-8 characters (emoji, etc.)\n');
  process.stdout.write('  • Tab, Enter, Backspace\n');
  process.stdout.write('\n');
  process.stdout.write('Press ESC to exit\n');
}
