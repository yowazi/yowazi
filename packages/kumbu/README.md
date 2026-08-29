# @yowazi/kumbu

Virtual buffer canvas for Yowazi TUI framework. 2D cell-based rendering with layers, overlays, and dirty-region tracking.

**What kumbu does:**
- Positioned rendering: place styled blocks at explicit `(x, y)` coordinates
- Layering: multiple layers (base, overlay, etc.) with bottom-to-top compositing
- Overlays: modal dialogs and floating elements with transparency support
- Dirty-region tracking: efficiently repaint only changed rows
- Viewports: scrollable windows into tall content

**What kumbu does NOT do (and where these belong):**
- Component library (buttons, inputs, dialogs) — belongs to `@yowazi/semu`
- Layout constraints or auto-sizing — use `@yowazi/rangi` composition for simpler layouts
- State management or event handling — belongs to `@yowazi/kini`

## Quick Start

```js
import { Canvas } from '@yowazi/kumbu';
import { Style } from '@yowazi/rangi';

// Create a 60x20 canvas
const canvas = new Canvas(60, 20);

// Render positioned blocks
const title = new Style().bold().render('My App');
canvas.render(title, 2, 0);

// Add an overlay (modal)
const modal = new Style().border('normal').padding(1).render('Confirm?');
canvas.overlay(modal, 15, 8, { transparent: true });

// Output to terminal
console.log(canvas.toANSI().join('\n'));
```

## Mental Model

Kumbu maintains a 2D grid of **cells**, where each cell holds character, width, attributes (bold, italic), and color data. When you `render()` or `overlay()` a styled block:

1. The block is parsed into cells (ANSI codes → cell attributes)
2. Cells are placed at the given `(x, y)` on the target layer
3. When compositing (`toANSI()`), layers are flattened: topmost non-null cell at each position wins
4. Cells are converted back to ANSI strings, ready for terminal output

**Transparency heuristic (v1):** `overlay()` with `transparent: true` treats space characters with no background as see-through (write `null` to those cells), allowing background content to show through. Real padding in the overlay still paints normally.

## API Reference

### `Canvas`

```js
new Canvas(width, height)
  .render(block, x, y, layerName = 'base')   // Opaque write to layer
  .overlay(block, x, y, {layer, transparent} = {}) // Overlay with transparency
  .addLayer(name)                            // Create new layer
  .createViewport(x, y, w, h)                // Create scrolling viewport
  .getDirtyRegions()                         // → dirty row indices
  .clearDirtyRegions()                       // Reset dirty tracking
  .toANSI({regions = 'all'})                 // → ANSI strings (all or dirty rows)
```

All positions are 0-based. Cells falling outside `[0, width) × [0, height)` are silently clipped.

### `Viewport`

Created via `canvas.createViewport()`:
```js
viewport
  .setContent(block)    // Set full content (may be taller than viewport)
  .scroll(offset)       // Scroll to row offset (clamped to valid range)
```

## Known Limitations

- No alpha-blending — transparency is binary (space+no-bg = see-through, else opaque)
- Dirty tracking is row-level, not sub-rectangle
- Viewport scrolling is vertical-only
- No automatic terminal-size-driven resizing
- Grapheme clusters beyond Unicode surrogate pairs (e.g. ZWJ emoji) not specially handled

## How It Fits

Kumbu bridges `@yowazi/rangi` (styling + structural layout) and `@yowazi/semu` (components):

- **Simple apps**: use rangi's `joinVertical`/`joinHorizontal` (string composition)
- **Complex layouts**: use kumbu (positioned canvas with overlays)
- **Components**: semu can use rangi alone, or kumbu for positioned/overlay features

---

Built on `@yowazi/singi` (terminal I/O) and `@yowazi/rangi` (styling/theming).
