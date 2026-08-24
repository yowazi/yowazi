# singi

Low-level ANSI/terminal primitives for building TUI applications. Part of the [Yowazi](https://github.com/rheinardkorf/yowazi) framework.

`singi` (from Swahili "msingi" - foundation) provides direct access to terminal control sequences. It handles cursor positioning, text formatting, color detection, and screen management without external dependencies.

## Features

- 🎨 **Color support** - Automatic detection and downsampling for 16-color, 256-color, and truecolor terminals
- 🖱️ **Cursor control** - Position, hide/show, save/restore cursor
- 🖥️ **Screen control** - Clear screen, erase lines, fullscreen mode
- 📝 **Text formatting** - Bold, dim, italic, underline, blink, invert, strikethrough
- ⌨️ **Input decoding** - Keyboard input parsing (UTF-8, escape sequences, modifiers, mouse events, bracketed paste)
- 📊 **Character width** - Unicode character width for terminal layout (handles CJK, emoji, combining marks)
- 📳 **Terminal modes** - Raw mode, signal handling (SIGWINCH, SIGINT, SIGTERM), capability negotiation
- 🔧 **Low-level primitives** - Direct access to CSI escape sequences
- ♿ **Accessibility** - Respects `NO_COLOR` and `FORCE_COLOR` environment variables

## Installation

```bash
npm install singi
# or
bun add singi
# or
yarn add singi
```

## Quick Start

### Terminal Information

```javascript
import { getTerminalSize } from 'singi';
import { detectColorProfile } from 'singi/color';

const { width, height } = getTerminalSize();
console.log(`Terminal: ${width}x${height}`);

const profile = detectColorProfile();
console.log(`Colors supported: ${profile}`); // 'Ansi16', 'Ansi256', 'TrueColor', or 'NoColor'
```

### Cursor Control

```javascript
import { cursorPos, cursorUp, hideCursor, showCursor } from 'singi';

process.stdout.write(hideCursor());           // Hide cursor
process.stdout.write(cursorPos(5, 10));       // Move to row 5, column 10
process.stdout.write(cursorUp(3));            // Move up 3 lines
process.stdout.write(showCursor());           // Show cursor
```

**Note:** Terminal coordinates use **(row, column)** order, where row 1 is the top and column 1 is the left. This is the standard ANSI/VT100 convention.

### Text Formatting

```javascript
import { bold, underline, stripAnsi } from 'singi';

const formatted = bold() + underline() + 'Important' + stripAnsi(bold() + underline());
console.log(formatted); // Bold underlined text

// Remove ANSI codes from a string
const withoutAnsi = stripAnsi(formatted);
console.log(withoutAnsi); // 'Important'
```

### Colors

```javascript
import { fg, bg, detectColorProfile } from 'singi/color';

// Automatic color downsampling based on terminal capability
const redText = fg(255, 0, 0) + 'Red text';
const blueBackground = bg(0, 0, 255) + 'Blue background';

console.log(redText);
console.log(blueBackground);
console.log('\x1b[0m'); // Reset (equivalent to sgrReset())

// Manual color profile handling
import { ColorProfile, downsampler } from 'singi/color';

const profile = detectColorProfile();
const convert = downsampler(profile);

if (profile === ColorProfile.TrueColor) {
  console.log(convert(255, 100, 50)); // '255;100;50'
} else if (profile === ColorProfile.Ansi256) {
  console.log(convert(255, 100, 50)); // '196' (palette index)
}
```

### Raw Mode & Input Decoding

```javascript
import { setRawMode, setNormalMode, createKeyDecoder } from 'singi';

const decoder = createKeyDecoder();

// Enable raw mode with resize and signal handling
setRawMode({
  onResize: (size) => console.log(`Terminal: ${size.width}x${size.height}`),
  onSignal: (signal) => {
    console.log(`Received ${signal}`);
    setNormalMode();
    process.exit(0);
  }
});

// Handle keyboard input
process.stdin.on('data', chunk => {
  const events = decoder.push(chunk);
  events.forEach(event => {
    if (event.type === 'key') {
      console.log(`Pressed: ${event.key}`);
    }
  });
});
```

### Fullscreen Mode

```javascript
import { enterFullscreen, exitFullscreen, cursorPos, showCursor } from 'singi';

// Enter fullscreen mode (automatically handles cleanup on exit/errors)
enterFullscreen({ hideCursor: true });

// Your TUI code here
process.stdout.write(cursorPos(1, 1));
process.stdout.write('Hello, fullscreen world!');

// Exit when done
await new Promise(resolve => setTimeout(resolve, 2000));
exitFullscreen();
```

## API Reference

### Terminal

#### `getTerminalSize(): { width: number, height: number }`
Returns the current terminal dimensions with fallbacks to 80x24.

#### `enterFullscreen(options?: { hideCursor?: boolean }): void`
Enter fullscreen mode with automatic signal handlers for cleanup. Safely handles multiple calls.

#### `exitFullscreen(): void`
Exit fullscreen mode and restore the terminal. Safely handles multiple calls.

### Cursor Control

- `cursorPos(row: number, col: number): string` - Move to absolute position (1-indexed: row 1 = top, column 1 = left)
- `cursorUp(n?: number): string` - Move up n lines (default: 1)
- `cursorDown(n?: number): string` - Move down n lines (default: 1)
- `cursorLeft(n?: number): string` - Move left n columns (default: 1)
- `cursorRight(n?: number): string` - Move right n columns (default: 1)
- `hideCursor(): string` - Hide the cursor
- `showCursor(): string` - Show the cursor
- `saveCursor(): string` - Save cursor position and attributes
- `restoreCursor(): string` - Restore saved cursor position and attributes

### Screen Control

- `clearScreen(): string` - Clear entire screen
- `eraseToEndOfScreen(): string` - Erase from cursor to end of screen
- `eraseLine(): string` - Erase entire line
- `eraseToEndOfLine(): string` - Erase from cursor to end of line
- `altScreenEnable(): string` - Enter alternate screen buffer
- `altScreenDisable(): string` - Exit alternate screen buffer

### Text Attributes (SGR)

- `bold(): string` / `noBold(): string`
- `dim(): string` / `noDim(): string`
- `italic(): string` / `noItalic(): string`
- `underline(): string` / `noUnderline(): string`
- `blink(): string` / `noBlink(): string`
- `invert(): string` / `noInvert(): string`
- `strike(): string` / `noStrike(): string`
- `sgr(...params: (string|number)[]): string` - Raw SGR sequence builder
- `sgrReset(): string` - Reset all attributes

### Color (`singi/color`)

#### `detectColorProfile(forceDetect?: boolean): ColorProfile`
Detects terminal color capability from environment variables and terminal properties. Results are cached.

**ColorProfile values:**
- `'NoColor'` - No color support (respects `NO_COLOR`)
- `'Ansi16'` - 16-color ANSI
- `'Ansi256'` - 256-color ANSI
- `'TrueColor'` - 24-bit RGB (16.7 million colors)

#### `downsampler(profile: ColorProfile): (r: number, g: number, b: number) => string`
Returns a color conversion function for the given profile.

#### `fg(r: number, g: number, b: number): string`
Returns a foreground color escape sequence. RGB values are 0-255.

#### `bg(r: number, g: number, b: number): string`
Returns a background color escape sequence. RGB values are 0-255.

### Input Decoding

#### `createKeyDecoder(): { push, flush }`
Creates a stateful decoder for ANSI keyboard input sequences. Converts raw bytes from stdin into structured input events.

**Returns:**
- `push(chunk: Buffer | Uint8Array): InputEvent[]` - Process a chunk of input, returns completed events
- `flush(): InputEvent[]` - Flush remaining buffered bytes as events

**Event types:**
```javascript
// KeyEvent (supports Ctrl, Shift, Alt modifiers)
{ type: 'key', key: string, ctrl?: boolean, shift?: boolean, alt?: boolean }

// MouseEvent (SGR mouse protocol)
{ type: 'mouse', x: number, y: number, button: string, action: string }

// PasteEvent (bracketed paste mode)
{ type: 'paste', text: string }

// ResizeEvent (terminal resize via SIGWINCH)
{ type: 'resize', rows: number, cols: number }
```

**Supported key names:**
- Single characters: `'a'`, `'1'`, `'!'`, etc.
- Special keys: `'escape'`, `'tab'`, `'enter'`, `'backspace'`, `'delete'`
- Arrow keys: `'up'`, `'down'`, `'left'`, `'right'` (supports Ctrl/Shift modifiers)
- Navigation: `'home'`, `'end'`, `'pageup'`, `'pagedown'`
- Function keys: `'f1'` through `'f12'` (supports Ctrl/Shift modifiers)
- UTF-8: Emoji and international characters

**Modifiers:**
- `Ctrl+<key>`: `{ type: 'key', key, ctrl: true }`
- `Shift+<key>`: `{ type: 'key', key, shift: true }`
- `Alt+<key>`: `{ type: 'key', key, alt: true }`
- Combined: `{ type: 'key', key, ctrl: true, shift: true }`

**Bracketed Paste:**
When bracketed paste mode is enabled (via `setRawMode`), pasted text is delivered as a single `PasteEvent` instead of individual key events, preserving formatting and newlines.

**Example:**
```javascript
import { createKeyDecoder } from 'singi';

const decoder = createKeyDecoder();

process.stdin.on('data', (chunk) => {
  const events = decoder.push(chunk);
  events.forEach(event => {
    if (event.type === 'key') {
      console.log(`Key pressed: ${event.key}${event.ctrl ? ' (Ctrl)' : ''}${event.alt ? ' (Alt)' : ''}`);
    }
  });
});
```

### Character Width

#### `charWidth(char: string): number`
Get display width of a single character in columns (0, 1, or 2).

Properly handles:
- Control characters (0 columns)
- ASCII (1 column)
- CJK characters (2 columns)
- Emoji (2 columns)
- Combining marks (0 columns)

#### `stringWidth(str: string): number`
Get total display width of a string in columns.

#### `sliceWidth(str: string, maxWidth: number): string`
Slice string to fit within max width in columns.

#### `padWidth(str: string, width: number, align?: 'left' | 'right'): string`
Pad string to exact width with spaces.

#### `truncateWidth(str: string, maxWidth: number, suffix?: string): string`
Truncate string to fit within width, optionally adding suffix (e.g., '…').

### Terminal Mode

#### `setRawMode(options?: ModeOptions): boolean`
Enable raw mode on stdin and configure terminal capabilities.

Raw mode allows capturing individual keypresses, escape sequences, and control codes. It disables line buffering and terminal echo.

**Options:**
```javascript
{
  capabilities?: {
    bracketedPaste?: boolean,    // Enable bracketed paste mode (default: true)
    mouseReporting?: boolean,    // Enable SGR mouse reporting (default: true)
    focusEvents?: boolean        // Enable focus event tracking (default: true)
  },
  onResize?: (size: {width, height}) => void,  // SIGWINCH handler
  onSignal?: (signal: string) => void          // Signal handler (SIGINT, SIGTERM, SIGTSTP)
}
```

**Returns:** `true` if raw mode was enabled, `false` if stdin is not a TTY.

#### `setNormalMode(): void`
Restore normal terminal mode and disable all capabilities.

Cleans up signal handlers and restores terminal echo and line buffering.

#### `isRawMode(): boolean`
Check if raw mode is currently active.

**Example:**
```javascript
import { setRawMode, setNormalMode, createKeyDecoder } from 'singi';

setRawMode({
  onResize: (size) => console.log(`Resized to ${size.width}x${size.height}`),
  onSignal: (signal) => {
    console.log(`Received ${signal}`);
    setNormalMode();
    process.exit(0);
  }
});

const decoder = createKeyDecoder();
process.stdin.on('data', chunk => {
  const events = decoder.push(chunk);
  // Handle input...
});
```

### Raw Escape Sequences

- `CSI: string` - Control Sequence Introducer prefix (`\x1b[`)
- `OSC: string` - Operating System Command prefix (`\x1b]`)

## Utilities

#### `stripAnsi(str: string): string`
Removes all ANSI escape sequences from a string.

```javascript
import { stripAnsi, bold } from 'singi';

const length = stripAnsi(bold() + 'text').length; // 4 (not including escape codes)
```

## Environment Variables

- `NO_COLOR` - Disables color output (respects the [NO_COLOR](https://no-color.org/) standard)
- `FORCE_COLOR` - Forces color level:
  - `0` or `false` - No color
  - `1` - 16-color
  - `2` - 256-color
  - `3` - Truecolor
  - Other values default to 256-color

## Examples

See the `examples/` directory for more detailed usage patterns.

## Design

`singi` is intentionally minimal. It provides only the raw ANSI primitives needed to build higher-level components. The philosophy is:

- **Direct mapping to ANSI standards** - No abstraction layer, no magic
- **Zero dependencies** - Pure JavaScript, runs directly with `bun`
- **Composable** - Use with `@yowazi/rangi` for semantic styling, `@yowazi/kini` for application logic

## License

MIT
