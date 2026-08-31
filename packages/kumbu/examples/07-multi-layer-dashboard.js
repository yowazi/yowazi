#!/usr/bin/env bun

/**
 * Example 7: Multi-Layer Dashboard
 *
 * Demonstrates kumbu's layering system with multiple independent layers,
 * viewports, and overlays. A complete dashboard example showing:
 * - Multiple named layers (base, panels, overlay)
 * - Viewport with scrollable content
 * - Side panel on separate layer
 * - Modal overlay on top layer with background color
 * - Independent layer updates
 * - Theme switching
 *
 * Controls:
 * - UP/DOWN: scroll main content
 * - 'p': toggle panel visibility
 * - 'm': toggle modal visibility
 * - 't': switch themes (dark/cyber)
 * - 'q'/ESC: quit
 */

import { Canvas } from '@yowazi/kumbu';
import { Style, setTheme } from '@yowazi/rangi';
import { dark, cyber } from '@yowazi/rangi/themes';
import {
  setRawMode,
  setNormalMode,
  getTerminalSize,
  createKeyDecoder,
  clearScreen,
  cursorPos,
  hideCursor,
  showCursor,
  altScreenEnable,
  altScreenDisable,
} from '@yowazi/singi';

const decoder = createKeyDecoder();
let lastSize = getTerminalSize();

// Ensure we have valid terminal size
if (!lastSize || lastSize.width < 60 || lastSize.height < 16) {
  console.error('Terminal must be at least 60x16');
  process.exit(1);
}

// State
let mainScroll = 0;
let showPanel = true;
let showModal = false;
let currentThemeObj = dark;
const themeObjects = [dark, cyber];
const themeNames = ['dark', 'cyber'];
let currentThemeIdx = 0;

// Set initial theme
setTheme(currentThemeObj);

// Setup raw mode
const modeSetup = setRawMode({
  onResize: () => {
    lastSize = getTerminalSize();
    render();
  },
  onSignal: (signal) => {
    cleanup();
    process.exit(0);
  },
});

if (!modeSetup) {
  console.error('Failed to set raw mode. Is this a TTY?');
  process.exit(1);
}

// Enter alternate screen buffer to preserve terminal scroll history
process.stdout.write(altScreenEnable());
process.stdout.write(hideCursor());

// Helper function to generate main content with semantics
function generateMainContent(viewportWidth) {
  return Array.from({ length: 50 }, (_, i) => {
    const lineNum = i + 1;
    const content = `[MAIN] Item ${lineNum.toString().padStart(2, '0')}: Important information and data`;
    const paddedContent = content.padEnd(viewportWidth, ' ');

    if (i === 0) {
      return new Style().bold().foreground('primary').background('default').render(paddedContent);
    }
    if (i % 4 === 0) {
      return new Style().foreground('alert').background('default').render(paddedContent);
    }
    return new Style().background('default').render(paddedContent);
  }).join('\n');
}

// Helper function to generate panel content with semantics
function generatePanelContent() {
  return Array.from({ length: 20 }, (_, i) => {
    const lineNum = i + 1;
    const content = `[PANEL ${lineNum}]`;
    return new Style().foreground('secondary').background('default').render(content);
  }).join('\n');
}

// Render function
function render() {
  const { width: termWidth, height: termHeight } = lastSize;

  // Create main canvas with multiple layers
  const canvas = new Canvas(termWidth, termHeight);

  // Add custom layers (base layer already exists)
  canvas.addLayer('panels');
  canvas.addLayer('overlay');

  // Fill entire canvas with default background color
  const bgLine = new Style().background('default').render(' '.repeat(termWidth));
  for (let y = 0; y < termHeight; y++) {
    canvas.render(bgLine, 0, y, 'base');
  }

  // ===== BASE LAYER: Header + Main Content =====
  const header = new Style()
    .border('double')
    .padding(0, 2)
    .width(termWidth)
    .align('center')
    .foreground('primary')
    .background('default')
    .contentBackground('primary')
    .render('Multi-Layer Dashboard');

  canvas.render(header, 0, 0, 'base');

  // Main content viewport (stretches between header and footer)
  const mainWidth = showPanel ? termWidth - 18 : termWidth;
  const viewportHeight = termHeight - 6;  // Header (3 rows) + Footer (3 rows)
  const mainViewport = canvas.createViewport(0, 3, mainWidth, viewportHeight);
  const mainContent = generateMainContent(mainWidth);
  mainViewport.setContent(mainContent);
  mainViewport.scroll(mainScroll);

  // Footer with all borders including bottom
  const footer = new Style()
    .border('normal')
    .padding(0, 1)
    .width(termWidth)
    .align('center')
    .foreground('secondary')
    .background('default')
    .render('↑/↓ scroll  |  p panel  |  m modal  |  t theme  |  q quit');

  canvas.render(footer, 0, termHeight - 3, 'base');

  // ===== PANELS LAYER: Side Panel =====
  if (showPanel) {
    const panelContent = generatePanelContent();
    const panelBox = new Style()
      .border('rounded')
      .padding(1)
      .width(16)
      .foreground('secondary')
      .background('default')
      .render(panelContent);

    canvas.render(panelBox, termWidth - 17, 3, 'panels');
  }

  // ===== OVERLAY LAYER: Modal =====
  if (showModal) {
    // Modal with background color (not transparent) and semantic styling
    const modal = new Style()
      .border('normal')
      .padding(1)
      .width(40)
      .align('center')
      .foreground('primary')
      .background('secondary')
      .render('Modal Overlay\n\nPress m to close\nThis is on the\noverlay layer');

    const modalX = Math.floor((termWidth - 40) / 2);
    const modalY = Math.floor((termHeight - 8) / 2);

    canvas.overlay(modal, modalX, modalY, {
      layer: 'overlay',
      transparent: false,
    });
  }

  // Render to terminal
  process.stdout.write(clearScreen() + cursorPos(1, 1));
  process.stdout.write(canvas.toTerminal());
}

function cleanup() {
  // Exit alternate screen buffer to restore terminal scroll history
  process.stdout.write(altScreenDisable());
  process.stdout.write(showCursor());
  setNormalMode();
}

process.on('exit', cleanup);

// Initial render
render();

// Handle input
process.stdin.on('data', (chunk) => {
  const events = decoder.push(chunk);

  events.forEach((event) => {
    if (event.type === 'key') {
      if (event.key === 'escape' || event.key === 'q' || event.key === 'ctrl-c') {
        cleanup();
        process.exit(0);
      } else if (event.key === 'up' || event.key === 'down') {
        const viewportHeight = lastSize.height - 6;
        const maxScroll = Math.max(0, 50 - viewportHeight);

        if (event.key === 'up') {
          mainScroll = Math.max(0, mainScroll - 3);
        } else {
          mainScroll = mainScroll + 3;
        }

        // Clamp to valid range
        mainScroll = Math.min(mainScroll, maxScroll);
        render();
      } else if (event.key === 'p') {
        showPanel = !showPanel;
        render();
      } else if (event.key === 'm') {
        showModal = !showModal;
        render();
      } else if (event.key === 't') {
        // Toggle between dark and cyber themes
        currentThemeIdx = (currentThemeIdx + 1) % themeObjects.length;
        currentThemeObj = themeObjects[currentThemeIdx];
        setTheme(currentThemeObj);
        render();
      }
    }
  });
});
