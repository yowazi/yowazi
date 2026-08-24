# singi

Low-level ANSI/terminal primitives for building TUI applications. Part of the [Yowazi](https://github.com/rheinardkorf/yowazi) framework.

`singi` (from Swahili "msingi" - foundation) provides direct access to terminal control sequences. It handles cursor positioning, text formatting, color detection, and screen management without external dependencies.

## Features

- 🎨 **Color support** - Automatic detection and downsampling for 16-color, 256-color, and truecolor terminals
- 🖱️ **Cursor control** - Position, hide/show, save/restore cursor
- 🖥️ **Screen control** - Clear screen, erase lines, fullscreen mode
- 📝 **Text formatting** - Bold, dim, italic, underline, blink, invert, strikethrough
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
