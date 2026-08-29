#!/usr/bin/env bun

/**
 * Example 5: Dirty Region Tracking with Interactive Updates
 *
 * Interactive demonstration of dirty region tracking.
 * - Press '1', '2', '3' to update different UI elements
 * - Watch which rows are marked as dirty
 * - Press ESC or 'q' to quit
 *
 * Demonstrates efficient terminal updates using kumbu's dirty tracking.
 */

import { Canvas } from '@yowazi/kumbu';
import { Style } from '@yowazi/rangi';
import {
  setRawMode,
  setNormalMode,
  getTerminalSize,
  createKeyDecoder,
  clearScreen,
  cursorPos,
  hideCursor,
  showCursor,
} from '@yowazi/singi';

const decoder = createKeyDecoder();
let lastSize = getTerminalSize();

// Ensure we have valid terminal size
if (!lastSize || lastSize.width < 40 || lastSize.height < 10) {
  console.error('Terminal is too small or size detection failed');
  process.exit(1);
}

// State for UI elements
let statusCount = 0;
let infoCount = 0;
let eventCount = 0;

// Setup raw mode with signal handlers
const modeSetup = setRawMode({
  onResize: () => {
    lastSize = getTerminalSize();
    render();
  },
  onSignal: (signal) => {
    cleanup();
    console.log(`\n✓ ${signal} received\n`);
    process.exit(0);
  },
});

if (!modeSetup) {
  console.error('Failed to set raw mode. Is this a TTY?');
  process.exit(1);
}

// Hide cursor
process.stdout.write(hideCursor());

// Render function
function render() {
  const { width: termWidth, height: termHeight } = lastSize;
  const canvasWidth = termWidth;
  const canvasHeight = termHeight;

  // Create fresh canvas for this render
  const canvas = new Canvas(canvasWidth, canvasHeight);

  // Header
  const header = new Style()
    .border('double')
    .padding(0, 2)
    .width(canvasWidth)
    .align('center')
    .foreground('primary')
    .render('Dirty Region Tracking Demo');

  canvas.render(header, 0, 0);

  // Status panel
  const statusBox = new Style()
    .border('normal')
    .padding(1)
    .width(Math.floor(canvasWidth / 2))
    .render(`Status Update #${statusCount}\n\nPress '1'`);

  canvas.render(statusBox, 0, 3);

  // Info panel
  const infoBox = new Style()
    .border('rounded')
    .padding(1)
    .width(Math.floor(canvasWidth / 2))
    .foreground('alert')
    .render(`Info Event #${infoCount}\n\nPress '2'`);

  canvas.render(infoBox, Math.floor(canvasWidth / 2), 3);

  // Dirty regions status line (shows which rows changed)
  const dirty = canvas.getDirtyRegions();
  const dirtyInfo = `Dirty: ${dirty.length > 0 ? dirty.join(', ') : 'none'}`;
  const dirtyStatus = new Style()
    .border('normal')
    .padding(0, 1)
    .width(canvasWidth)
    .align('left')
    .render(dirtyInfo);

  canvas.render(dirtyStatus, 0, canvasHeight - 6);

  // Stats footer (shows events and controls)
  const stats = new Style()
    .border('normal')
    .padding(0, 1)
    .width(canvasWidth)
    .align('left')
    .render(`Events: ${eventCount}  |  Press 1/2/3 to update, ESC/q to quit`);

  canvas.render(stats, 0, canvasHeight - 3);

  // Render to terminal using proper terminal formatting (handles newlines correctly)
  process.stdout.write(clearScreen() + cursorPos(1, 1));
  process.stdout.write(canvas.toTerminal());
}

function cleanup() {
  process.stdout.write(showCursor());
  setNormalMode();
}

// Setup cleanup handler
process.on('exit', cleanup);

// Initial render
render();

// Handle stdin input
process.stdin.on('data', (chunk) => {
  const events = decoder.push(chunk);

  events.forEach((event) => {
    if (event.type === 'key') {
      if (event.key === 'escape' || event.key === 'q' || event.key === 'ctrl-c') {
        cleanup();
        console.log('\n✓ Exiting\n');
        process.exit(0);
      } else if (event.key === '1') {
        statusCount++;
        eventCount++;
        render();
      } else if (event.key === '2') {
        infoCount++;
        eventCount++;
        render();
      } else if (event.key === '3') {
        statusCount++;
        infoCount++;
        eventCount += 2;
        render();
      }
    }
  });
});
