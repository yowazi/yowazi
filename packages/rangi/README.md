# @yowazi/rangi

Styling and theming layer for the Yowazi TUI framework.

**What rangi does:**
- Text styling: bold, italic, underline, dim, blink, invert, strikethrough
- Semantic color theming: define themes as named color roles (primary, secondary, alert, warning, error, default), then apply them to text without needing to know the exact RGB values
- Per-style theme overrides: use one theme globally but override for individual components
- Composable styles: nested styled text works correctly — closing an inner style doesn't wipe outer styling
- Box model: padding, borders (4 named styles + custom), sizing, and alignment
- Layout & composition: join blocks horizontally or vertically with automatic alignment and size normalization

**What rangi does NOT do (and where these belong):**
- Margins (space between sibling blocks) — can be added via `joinHorizontal`/`joinVertical` in a future `gap` parameter or by using padding-only blocks as spacers
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

## Layout & Composition

Rangi provides two functions for composing blocks (pre-rendered strings) into larger layouts:

### Mental Model

**Composition is about arranging pre-rendered blocks.** Once you've rendered styled text or boxes with `.render()`, you have a string. `joinVertical()` and `joinHorizontal()` take these strings and arrange them.

- **`joinVertical(align, ...blocks)`** — Stack blocks top-to-bottom
  - All blocks are padded to the same **width** (the widest block's width)
  - Alignment controls how narrower blocks are padded: `'left'` (pad on right), `'center'` (split), `'right'` (pad on left)

- **`joinHorizontal(align, ...blocks)`** — Place blocks side-by-side
  - All blocks are padded to the same **height** (the tallest block's height)
  - Alignment controls where shorter blocks sit within the height: `'top'` (pad below), `'center'` (split), `'bottom'` (pad above)

### Key Insight: Alignment Pairs with Dimension

Think of it this way:
- `joinVertical` aligns **horizontally** (left/center/right), controlling **width** padding
- `joinHorizontal` aligns **vertically** (top/center/bottom), controlling **height** padding

### Example: Dashboard Layout

```js
import { Style, joinVertical, joinHorizontal } from '@yowazi/rangi';

// Create a header
const header = new Style()
  .border('double')
  .width(50)
  .align('center')
  .render('My Dashboard');

// Create sidebar and main content
const sidebar = new Style()
  .border('normal')
  .width(20)
  .render('Menu\nItem 1\nItem 2');

const main = new Style()
  .border('normal')
  .render('Main content\ngoes here');

// Combine sidebar + main horizontally (top-aligned)
const body = joinHorizontal('top', sidebar, main);

// Stack header + body vertically (center-aligned for width)
const layout = joinVertical('center', header, body);

console.log(layout);
```

### ANSI Codes Are Preserved

All ANSI escape codes (colors, attributes) are preserved through composition. You can compose styled blocks and the colors survive intact.

```js
// Both of these have colors and stay colored in the final layout
const colored1 = new Style().foreground('primary').render('Primary');
const colored2 = new Style().foreground('error').render('Error');

const joined = joinHorizontal('top', colored1, colored2);
// Output preserves both colors side-by-side
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
- `.render(text)` — Render text with this style applied. If any box-model property is set, renders as a multi-line box with padding/borders; otherwise renders inline.
- `.padding(...)` — Set padding inside borders (CSS-style shorthand). `.padding(n)` (all sides), `.padding(v, h)` (vertical, horizontal), `.padding(t, r, b, l)` (explicit, clockwise).
- `.border(styleName)` — Set border style: `'normal'` (┌─┐│└┘), `'rounded'` (╭─╮│╰╯), `'thick'` (┏━┓┃┗┛), `'double'` (╔═╗║╚╝).
- `.borderSides(partial)` — Toggle specific border sides on/off: `{top, right, bottom, left}` (any omitted remain unchanged).
- `.borderForeground(role)` / `.borderForegroundRGB(r, g, b)` — Set border color (semantic or raw RGB; defaults to terminal default if unset).
- `.width(n)` — Set explicit content width in columns (rigid sizing; blocks don't participate in equal distribution in joins).
- `.height(n)` — Set explicit content height in lines.
- `.align(direction)` — Align content horizontally: `'left'`, `'center'`, or `'right'` (only meaningful with `.width()` set).

### `Theme`

Represents a single theme.

- `theme.rgb(role, channel)` — Get raw RGB triplet for a role/channel (`'primary'`/`'fg'`, etc.).
- `theme.ansi(role, channel)` — Get the ANSI escape string singi produces for this role/channel under the current terminal capability.
- `theme.reverseLookup(escapeFragment)` — Look up which role/channel produced this ANSI escape (if any).

### `getTheme()` / `setTheme(theme)`

Get or set the global theme.

### `joinVertical(align, ...blocks)` / `joinHorizontal(align, ...blocks)`

Compose pre-rendered blocks (strings) into larger layouts.

**joinVertical(align, ...blocks):**
- Stacks blocks top-to-bottom
- All blocks are padded to the same width (the widest block's width)
- `align` is `'left'` (pad right), `'center'` (split), or `'right'` (pad left)
- Preserves all ANSI escape codes within each block

**joinHorizontal(align, ...blocks):**
- Places blocks side-by-side
- All blocks are padded to the same height (the tallest block's height)
- `align` is `'top'` (pad bottom), `'center'` (split), or `'bottom'` (pad top)
- Preserves all ANSI escape codes within each block
- Each block is normalized independently (its own lines aligned to its own max width before joining)

**Example:**
```js
import { Style, joinHorizontal } from '@yowazi/rangi';

const sidebar = new Style()
  .border('normal')
  .padding(1)
  .width(20)
  .render('Menu\nItem 1\nItem 2');

const content = new Style()
  .border('normal')
  .padding(1)
  .render('Main content\ngoes here');

const layout = joinHorizontal('top', sidebar, content);
console.log(layout);
```

### Built-in themes

- `themes.dark` — Default, optimized for dark terminals.
- `themes.light` — Optimized for light terminals.
- `themes.cyber` — Neon cyberpunk aesthetic.
- `themes.retro` — Retro terminal colors.
- `themes.purple` — Purple-tinted palette.
- `themes.minimal` — Minimal monochrome with bold/dim only.
- `themes.transparent` — All backgrounds transparent (inherit terminal default).

---

Built on top of `@yowazi/singi` (terminal I/O and escape primitives).
