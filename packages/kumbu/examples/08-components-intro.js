#!/usr/bin/env bun

/**
 * Example 8: Interactive Components Introduction
 *
 * Demonstrates kumbu's Component system:
 * - Component protocol (render, handleKey, isFocusable)
 * - Focus management and tab order
 * - Keyboard event routing (child-first, bubble-up on decline)
 * - Message passing from components to app
 *
 * Controls:
 * - TAB: move focus to next box (cycles back to first)
 * - Shift+TAB: move focus to previous box (cycles backward)
 * - Any printable character: type text in the focused box
 * - Backspace: delete last character
 * - Ctrl+C: quit
 */

import { Canvas, Component, Text, VGroup, Spacer, TextInput } from '@yowazi/kumbu';
import { setTheme, splitLines } from '@yowazi/rangi';
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
  stringWidth,
} from '@yowazi/singi';


/**
 * Root: the app's root component. Handles app-level quitting.
 */
class Root extends Component {
  constructor(child) {
    super();
    this.child = child;
    this._childRects = [];
  }

  render(props = {}) {
    const output = this.child.render(props);

    // Track child position (child starts at 0,0 within Root's output)
    // Calculate child dimensions
    const lines = splitLines(output);
    const height = lines.length;
    const width = Math.max(...lines.map(line => stringWidth(line)), 0);

    this._childRects = [{
      child: this.child,
      rect: { x: 0, y: 0, width, height }
    }];

    return output;
  }

  getChildren(props = {}) {
    return [this.child];
  }

  handleKey(event, props = {}) {
    // Quit on Ctrl+C
    if (event.key === 'ctrl-c') {
      return { type: 'quit' };
    }

    // All other keys: delegate to child
    if (this.child && typeof this.child.handleKey === 'function') {
      return this.child.handleKey(event, props);
    }
    return null;
  }

  handleMouse(event, props = {}) {
    return this.child.handleMouse(event, props);
  }
}

// ============================================================================

setTheme(cyber);

const decoder = createKeyDecoder();
let lastSize = getTerminalSize();

// Ensure we have valid terminal size
if (!lastSize || lastSize.width < 60 || lastSize.height < 20) {
  console.error('Terminal must be at least 60x20');
  process.exit(1);
}

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

// Singi's setRawMode already enables mouse reporting (X11, SGR, and URXVT modes)

// Build component tree (long-lived across frames)
const input1 = new TextInput({
  maxLength: 39,
  focused: { foreground: 'primary', borderForeground: 'primary' },
  unfocused: { foreground: 'secondary', borderForeground: 'secondary' }
});
const input2 = new TextInput({
  maxLength: 39,
  focused: { foreground: 'primary', borderForeground: 'primary' },
  unfocused: { foreground: 'secondary', borderForeground: 'secondary' }
});
const input3 = new TextInput({
  maxLength: 39,
  focused: { foreground: 'primary', borderForeground: 'primary' },
  unfocused: { foreground: 'secondary', borderForeground: 'secondary' }
});

const hgroup = new VGroup([
  new Text('Interactive Components Demo'),
  new Spacer({ height: 1 }),
  new Text('Tab to move focus, type to enter text, Backspace to delete, Ctrl+C to quit'),
  new Spacer({ height: 1 }),
  new Text('Input 1:'),
  input1,
  new Spacer({ height: 1 }),
  new Text('Input 2:'),
  input2,
  new Spacer({ height: 1 }),
  new Text('Input 3:'),
  input3,
], { gap: 0 });

const root = new Root(hgroup);

const canvas = new Canvas(lastSize.width, lastSize.height);
canvas.setRootComponent(root);

function render() {
  process.stdout.write(clearScreen() + cursorPos(1, 1));

  // Render the component tree
  canvas.renderComponent({});

  // Output to terminal
  process.stdout.write(canvas.toTerminal());

  // Canvas handles cursor positioning for focused components with getCursorPos
  process.stdout.write(canvas.getCursorOutput({ cursorPos, showCursor, hideCursor }));
}

function cleanup() {
  // Exit alternate screen buffer to restore terminal scroll history
  process.stdout.write(altScreenDisable());
  process.stdout.write(showCursor());

  // setNormalMode() will also disable mouse and other capabilities
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
      // Dispatch to the component tree
      const msg = canvas.dispatchKey(event, {});

      if (msg?.type === 'quit') {
        cleanup();
        process.exit(0);
      }

      // Re-render after every key
      render();
    } else if (event.type === 'mouse') {
      // Singi's decoder automatically converts mouse escape sequences to mouse events
      // Dispatch them to the component tree (can focus text inputs by clicking on them)
      canvas.dispatchMouse(event, {});
      render();
    }
  });
});
