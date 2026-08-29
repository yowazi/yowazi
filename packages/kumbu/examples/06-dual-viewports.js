#!/usr/bin/env bun

/**
 * Example 6: Dual Independent Scrolling Viewports
 *
 * Interactive fullscreen demonstration of two side-by-side scrollable viewports.
 * - Press w/s to scroll LEFT column up/down
 * - Press UP/DOWN arrow keys to scroll RIGHT column up/down
 * - Watch dirty region tracking for both independently
 * - Press ESC or 'q' to quit
 *
 * Demonstrates kumbu supporting multiple independent viewport interactions.
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

// Scroll state for both columns
let leftScroll = 0;
let rightScroll = 0;

// Create content for left column (100 lines)
const leftContent = Array.from({ length: 100 }, (_, i) => {
  const lineNum = i + 1;
  const content = `[LEFT] Line ${lineNum.toString().padStart(3, '0')}: Lorem ipsum dolor sit amet`;
  if (i === 0 || i === 99) {
    return new Style().bold().foreground('primary').render(content);
  }
  if (i % 5 === 0) {
    return new Style().foreground('alert').render(content);
  }
  return content;
}).join('\n');

// Create content for right column (100 lines with different content)
const rightContent = Array.from({ length: 100 }, (_, i) => {
  const lineNum = i + 1;
  const content = `[RIGHT] Line ${lineNum.toString().padStart(3, '0')}: Consectetur adipiscing elit`;
  if (i === 0 || i === 99) {
    return new Style().bold().foreground('primary').render(content);
  }
  if (i % 7 === 0) {
    return new Style().foreground('alert').render(content);
  }
  return content;
}).join('\n');

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
    .render('Dual Independent Scrolling Viewports');

  canvas.render(header, 0, 0);

  // Calculate column dimensions
  const columnWidth = Math.floor((canvasWidth - 1) / 2); // -1 for divider
  const viewportHeight = canvasHeight - 6;  // Header (3) + Footer (3) = 6

  // Left viewport
  const leftViewport = canvas.createViewport(0, 3, columnWidth, viewportHeight);
  leftViewport.setContent(leftContent);
  leftViewport.scroll(leftScroll);

  // Column divider (single line between columns)
  const divider = new Style().render('│');
  for (let y = 3; y < 3 + viewportHeight; y++) {
    canvas.render(divider, columnWidth, y);
  }

  // Right viewport
  const rightViewport = canvas.createViewport(columnWidth + 1, 3, columnWidth - 1, viewportHeight);
  rightViewport.setContent(rightContent);
  rightViewport.scroll(rightScroll);

  // Constrain scroll offsets
  const maxLeftScroll = Math.max(0, 100 - viewportHeight);
  const maxRightScroll = Math.max(0, 100 - viewportHeight);
  leftScroll = Math.min(Math.max(0, leftScroll), maxLeftScroll);
  rightScroll = Math.min(Math.max(0, rightScroll), maxRightScroll);

  // Controls footer
  const controls = new Style()
    .border('normal')
    .padding(0, 1)
    .width(canvasWidth)
    .align('center')
    .render('w/s ← LEFT scroll  |  ↑/↓ → RIGHT scroll  |  ESC/q quit');

  canvas.render(controls, 0, canvasHeight - 3);

  // Render to terminal
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
      } else if (event.key === 'w') {
        // Scroll left column up
        leftScroll = Math.max(0, leftScroll - 3);
        render();
      } else if (event.key === 's') {
        // Scroll left column down
        leftScroll = Math.min(100, leftScroll + 3);
        render();
      } else if (event.key === 'up') {
        // Scroll right column up
        rightScroll = Math.max(0, rightScroll - 3);
        render();
      } else if (event.key === 'down') {
        // Scroll right column down
        rightScroll = Math.min(100, rightScroll + 3);
        render();
      }
    }
  });
});
