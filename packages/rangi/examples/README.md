# Rangi Examples

Progressive examples showcasing rangi's features, from basic to advanced.

Each example builds on the previous one and can be run independently.

## Running Examples

```bash
bun examples/01-basic-styling.js
bun examples/02-text-attributes.js
# ... etc
```

## Examples

### 01-basic-styling.js
**Concepts:** Style builder, render(), fluent API

The absolute basics: create a Style, add attributes, render text.

```js
const bold = new Style().bold();
console.log(bold.render('Bold text'));
```

### 02-text-attributes.js
**Concepts:** All available text attributes

Showcases all text attributes:
- `bold()` — bold text
- `dim()` — dimmed/faint text
- `italic()` — italicized text
- `underline()` — underlined text
- `blink()` — blinking text
- `invert()` — inverted colors (reverse video)
- `strike()` — strikethrough text

Shows how to combine multiple attributes.

### 03-semantic-colors.js
**Concepts:** Semantic color roles, theme-aware styling

Introduces the six semantic color roles that make up a theme:
- `default` — neutral, default text
- `primary` — main UI elements (buttons, headers)
- `secondary` — supporting elements (borders, labels)
- `alert` — important notices
- `warning` — caution messages
- `error` — error messages

Each role has both foreground (`foreground(role)`) and background (`background(role)`) variants.

```js
const button = new Style()
  .bold()
  .foreground('primary')
  .background('secondary');
console.log(button.render('Click Me'));
```

### 04-theme-switching.js
**Concepts:** Global theme switching, theme-aware rendering

Shows how the same Style renders with different colors when the global theme changes.

Themes are global and affect all subsequent renders, but don't retroactively change already-rendered output (that's picha's job).

```js
setTheme(dark);
const style = new Style().foreground('primary');
console.log(style.render('Dark'));

setTheme(light);
console.log(style.render('Light'));  // Same style, different color
```

### 05-raw-colors.js
**Concepts:** Raw RGB colors, theme-agnostic styling

Introduces raw RGB colors that are independent of theming:
- `foregroundRGB(r, g, b)` — custom foreground color
- `backgroundRGB(r, g, b)` — custom background color

Useful for brand colors, custom palettes, or UI that should never change with theme.

```js
const brand = new Style().foregroundRGB(66, 135, 245);
console.log(brand.render('Brand blue'));  // Same color in any theme
```

### 06-nested-styles.js
**Concepts:** Composing styled text, nested rendering

Shows how to compose text by nesting one Style inside another.

Rangi uses per-channel close codes (instead of a blanket reset) to ensure:
- Independent channels (bold + italic) never interfere
- Shared channels (nested colors) correctly restore the outer style after the inner closes

```js
const outer = new Style().bold().foreground('primary');
const inner = new Style().italic().foreground('warning');

const text = outer.render(
  `Bold outer with ${inner.render('italic inner')} and bold again.`
);
```

### 07-theme-overrides.js
**Concepts:** Per-style theme overrides

Shows how to override the global theme for individual styles.

Useful for components that need a specific theme (e.g., a light-mode dialog in a dark-mode app).

```js
setTheme(dark);

// Uses global dark theme
const globalStyle = new Style().foreground('primary');

// Overrides to light theme, regardless of global
const lightOverride = new Style()
  .theme(light)
  .foreground('primary');
```

### 08-complete-example.js
**Concepts:** Combining all features

A realistic example: a terminal status display using all of rangi's features together.

Shows how semantic colors, attributes, and styling combine to create a readable, coherent terminal UI.

### 09-all-themes.js
**Concepts:** Built-in themes showcase

Demonstrates all 7 built-in themes and how they interpret semantic color roles.

Useful for:
- Choosing a theme for your app
- Understanding how semantic roles differ across themes
- Seeing the aesthetic and mood of each theme

### 10-no-color-support.js
**Concepts:** NO_COLOR standard compliance

Shows how to respect the `NO_COLOR` environment variable.

When `NO_COLOR` is set:
- Uses text attributes (bold, underline) instead of colors
- Respects user accessibility preferences
- Works correctly when piped to files or logs
- Follows the NO_COLOR standard: https://no-color.org/

Try running:
```bash
bun examples/10-no-color-support.js          # With colors
NO_COLOR=1 bun examples/10-no-color-support.js # Without colors
```

### 11-transparent-colors.js
**Concepts:** Transparent (null) background colors

Demonstrates using `null` (transparent) background colors in themes.
When a theme color is `null`, that component doesn't override the terminal's background—it inherits it.

**Key insight:**
- Transparent backgrounds let UI adapt to any terminal color scheme
- Useful for overlays, floating elements, and UI that shouldn't set backgrounds
- Compare with opaque backgrounds that override the terminal default

---

## Learning Path

1. **Start here:** 01-basic-styling.js
2. **Explore attributes:** 02-text-attributes.js
3. **Learn theming:** 03-semantic-colors.js → 04-theme-switching.js
4. **Mix in raw colors:** 05-raw-colors.js
5. **Master composition:** 06-nested-styles.js
6. **Advanced theming:** 07-theme-overrides.js
7. **See it all together:** 08-complete-example.js
8. **Explore aesthetics:** 09-all-themes.js (choose your theme!)
9. **Accessibility & standards:** 10-no-color-support.js (respect NO_COLOR)
10. **Advanced feature:** 11-transparent-colors.js (null colors for adaptive UIs)
