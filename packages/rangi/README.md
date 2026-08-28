# @yowazi/rangi

Styling and theming layer for the Yowazi TUI framework.

**What rangi does:**
- Text styling: bold, italic, underline, dim, blink, invert, strikethrough
- Semantic color theming: define themes as named color roles (primary, secondary, alert, warning, error, default), then apply them to text without needing to know the exact RGB values
- Per-style theme overrides: use one theme globally but override for individual components
- Composable styles: nested styled text works correctly — closing an inner style doesn't wipe outer styling

**What rangi does NOT do (and where these belong):**
- Box model (padding, borders, margins) — deferred to a later phase
- Layout & composition (joining blocks horizontally/vertically) — deferred to a later phase
- Components (buttons, inputs, lists) — belongs to `@yowazi/semu`
- Application state & event handling — belongs to `@yowazi/kini`

## Quick Start

```js
import { Style, setTheme, themes } from '@yowazi/rangi';

// Set your app's theme once at startup
setTheme(themes.dark);

// Build reusable styled text
const heading = new Style()
  .bold()
  .foreground('primary');

const error = new Style()
  .foreground('error');

// Render styled text
console.log(heading.render('My App'));
console.log(error.render('Error: something went wrong'));

// Switch theme globally — all subsequent renders use the new theme
setTheme(themes.light);
console.log(heading.render('My App'));  // same Style, new colors
```

## Theme Format

Themes are defined as nested JSON objects (`.meta.json` format):

```json
{
  "name": "myTheme",
  "colors": {
    "default": { "fg": [230, 230, 230], "bg": [18, 18, 18] },
    "primary": { "fg": [80, 200, 120], "bg": [20, 60, 40] },
    "secondary": { "fg": [150, 150, 150], "bg": [40, 40, 40] },
    "alert": { "fg": [220, 50, 50], "bg": [60, 20, 20] },
    "warning": { "fg": [220, 180, 50], "bg": [60, 50, 10] },
    "error": { "fg": [255, 0, 0], "bg": [60, 0, 0] }
  }
}
```

Each role has a `fg` (foreground) and `bg` (background) value as RGB triplets `[r, g, b]`.

## Reverse Mapping

`Theme.reverseLookup()` is exposed as a public primitive for consumers that need to recover which semantic role produced a rendered ANSI escape sequence. This is primarily used by `@yowazi/picha` for cross-theme snapshot regression testing — it allows captured output to be re-themed without re-running the code that originally rendered it. Normal app code doesn't need this; it renders once under the theme set at init.

## Composed Styles

Styles compose correctly when nested:

```js
const outer = new Style().bold().foregroundRGB(255, 0, 0);  // bold red
const inner = new Style().italic().foregroundRGB(0, 0, 255); // italic blue

const text = outer.render(`Hello ${inner.render('World')}!`);
// "Hello" and "!" stay bold red; "World" is italic blue inside that
```

## API Reference

### `Style`

Immutable builder for styled text.

- `.bold()`, `.italic()`, `.underline()`, `.dim()`, `.blink()`, `.invert()`, `.strike()`
  — Enable/disable text attributes.
- `.foreground(role)` / `.background(role)`
  — Apply semantic color from the current theme. Pass a role name like `'primary'`, `'error'`, etc.
- `.foregroundRGB(r, g, b)` / `.backgroundRGB(r, g, b)`
  — Apply raw RGB color (bypasses theming).
- `.theme(themeInstance)`
  — Override the global theme for this style only.
- `.open()` — Get the ANSI escape prefix codes for this style.
- `.close()` — Get the ANSI escape suffix codes for this style.
- `.render(text)` — Render text with this style applied. Returns an ANSI-escaped string.

### `Theme`

Represents a single theme.

- `theme.rgb(role, channel)` — Get raw RGB triplet for a role/channel (`'primary'`/`'fg'`, etc.).
- `theme.ansi(role, channel)` — Get the ANSI escape string singi produces for this role/channel under the current terminal capability.
- `theme.reverseLookup(escapeFragment)` — Look up which role/channel produced this ANSI escape (if any).

### `getTheme()` / `setTheme(theme)`

Get or set the global theme.

### Built-in themes

- `themes.dark` — Default, optimized for dark terminals.
- `themes.light` — Optimized for light terminals.

---

Built on top of `@yowazi/singi` (terminal I/O and escape primitives).
