#!/usr/bin/env bun

/**
 * Example 9: Simple Interactive Text Input with Value Display
 *
 * A minimal example showing kumbu's TextInput component in action.
 * Demonstrates:
 * - Creating and composing components
 * - Focus management (Tab/Shift+Tab)
 * - Keyboard input handling
 * - Mouse click focus
 * - Retrieving component values (direct property access)
 *
 * Controls:
 * - Tab / Shift+Tab: navigate between inputs
 * - Click: focus input under cursor
 * - Type: enter text in focused input
 * - Backspace: delete text
 * - ESC: unfocus all inputs
 * - Ctrl+C: quit
 *
 * The current values of all three inputs are displayed at the bottom,
 * updating as you type. This shows how to access component state.
 */

import { Canvas, TextInput, Text, VGroup, Spacer } from '@yowazi/kumbu';
import { setTheme } from '@yowazi/rangi';
import { cyber } from '@yowazi/rangi/themes';
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
  sgr,
} from '@yowazi/singi';

setTheme(cyber);

const decoder = createKeyDecoder();
let lastSize = getTerminalSize();

if (!lastSize || lastSize.width < 50 || lastSize.height < 15) {
  console.error('Terminal must be at least 50x15');
  process.exit(1);
}

// Setup raw mode (automatically enables mouse via setRawMode)
const modeSetup = setRawMode({
  onResize: () => {
    lastSize = getTerminalSize();
    render();
  },
  onSignal: () => {
    cleanup();
    process.exit(0);
  },
});

if (!modeSetup) {
  console.error('Failed to set raw mode. Is this a TTY?');
  process.exit(1);
}

process.stdout.write(altScreenEnable());
process.stdout.write(hideCursor());

// Create three text inputs
// First one: warning for both border and content when focused
const name = new TextInput({ maxLength: 25, focused: { foreground: 'warning' } });
// Second one: default styling
const email = new TextInput({ maxLength: 35 });
// Third one: red (via RGB) for content and border when unfocused
const message = new TextInput({ maxLength: 50, unfocused: { contentForeground: { r: 199, g: 0, b: 0 } } });

// Build simple layout
const root = new VGroup([
  new Text('Simple Text Input Demo'),
  new Spacer({ height: 1 }),
  new Text('Name:'),
  name,
  new Spacer({ height: 1 }),
  new Text('Email:'),
  email,
  new Spacer({ height: 1 }),
  new Text('Message:'),
  message,
], { gap: 0 });

const canvas = new Canvas(lastSize.width, lastSize.height);
canvas.setRootComponent(root);

function render() {
  process.stdout.write(clearScreen() + cursorPos(1, 1));
  canvas.renderComponent({});
  process.stdout.write(canvas.toTerminal());

  // Display current values at the bottom
  const valuesY = lastSize.height - 2;
  process.stdout.write(cursorPos(valuesY, 1));
  process.stdout.write('─'.repeat(lastSize.width));
  process.stdout.write(cursorPos(valuesY + 1, 1));
  process.stdout.write(`${sgr(2)}Values: Name="${name.value}" | Email="${email.value}" | Message="${message.value}"${sgr(0)}`);

  // Canvas handles cursor positioning for focused components with getCursorPos
  process.stdout.write(canvas.getCursorOutput({ cursorPos, showCursor, hideCursor }));
}

function cleanup() {
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
    // Handle Ctrl+C at app level
    if (event.type === 'key' && event.key === 'ctrl-c') {
      cleanup();
      process.exit(0);
    }

    // Handle ESC to unfocus all components
    if (event.type === 'key' && event.key === 'escape') {
      canvas.focusManager.unfocus();
      render();
      return;
    }

    if (event.type === 'key') {
      canvas.dispatchKey(event, {});
      render();
    } else if (event.type === 'mouse') {
      canvas.dispatchMouse(event, {});
      render();
    }
  });
});
