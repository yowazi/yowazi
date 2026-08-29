#!/usr/bin/env bun

/**
 * Example 4: Viewport Scrolling with Keyboard Control
 *
 * Interactive viewport with keyboard control.
 * - Use UP/DOWN arrow keys to scroll through content
 * - Press ESC or 'q' to quit
 *
 * Demonstrates kumbu viewport scrolling with singi terminal control.
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
let scrollOffset = 0;

// Ensure we have valid terminal size
if (!lastSize || lastSize.width < 40 || lastSize.height < 10) {
  console.error('Terminal is too small or size detection failed');
  process.exit(1);
}

// Create tall content with 50 lines
const tallContent = Array.from({ length: 50 }, (_, i) => {
  const lineNum = i + 1;
  const content = `Line ${lineNum.toString().padStart(2, '0')}: This is scrollable content in the viewport`;
  if (i === 0 || i === 49) {
    return new Style().bold().foreground('primary').render(content);
  }
  if (i % 3 === 0) {
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

  // Create viewport (spans from row 3 to footer at canvasHeight - 3)
  const viewportHeight = canvasHeight - 6;
  const viewport = canvas.createViewport(0, 3, canvasWidth, viewportHeight);
  viewport.setContent(tallContent);

  // Constrain scroll offset
  const maxScroll = Math.max(0, 50 - viewportHeight);
  scrollOffset = Math.min(Math.max(0, scrollOffset), maxScroll);

  // Header
  const scrollInfo = `Scrolling: ${scrollOffset + 1}-${Math.min(scrollOffset + viewportHeight, 50)} of 50`;
  const header = new Style()
    .border('double')
    .padding(0, 2)
    .width(canvasWidth)
    .align('center')
    .foreground('primary')
    .render(scrollInfo);

  canvas.render(header, 0, 0);

  // Update viewport scroll
  viewport.scroll(scrollOffset);

  // Footer with instructions (3 rows: top border, content, bottom border)
  const footer = new Style()
    .border('normal')
    .padding(0, 1)
    .width(canvasWidth)
    .align('center')
    .render('↑/↓ to scroll  |  ESC/q to quit');

  canvas.render(footer, 0, canvasHeight - 3);

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
      } else if (event.key === 'up') {
        scrollOffset = Math.max(0, scrollOffset - 1);
        render();
      } else if (event.key === 'down') {
        scrollOffset = Math.min(50, scrollOffset + 1);
        render();
      }
    }
  });
});
