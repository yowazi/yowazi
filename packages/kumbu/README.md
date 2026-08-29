# @yowazi/kumbu

Virtual buffer canvas for Yowazi TUI framework. 2D cell-based rendering with layers, overlays, and dirty-region tracking.

**What kumbu does:**
- Positioned rendering: place styled blocks at explicit `(x, y)` coordinates
- Layering: multiple layers (base, overlay, etc.) with bottom-to-top compositing
- Overlays: modal dialogs and floating elements with transparency support
- Dirty-region tracking: efficiently repaint only changed rows
- Viewports: scrollable windows into tall content
- **Declarative layout** (v0.1.0): HGroup/VGroup for SwiftUI-like compositional layout without manual positioning math

**What kumbu does NOT do (and where these belong):**
- Component library (buttons, inputs, dialogs) — belongs to `@yowazi/semu`
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

### `HGroup` and `VGroup`

Declarative compositional layout containers (inspired by SwiftUI's `HStack`/`VStack`):

```js
import { HGroup, VGroup } from '@yowazi/kumbu';

// Natural sizing: children keep their size
const row = new HGroup(['Box1', 'Box2', 'Box3'], { gap: 2, align: 'top' });

// Fixed-width distribution: equal shares
const equalRow = new HGroup(['A', 'B', 'C'], { width: 30, gap: 1 });

// Nested groups for complex layouts
const layout = new VGroup([
  header,
  new HGroup([sidebar, content], { gap: 1 }),
  footer
], { gap: 1 });

// Render to canvas at position
layout.renderToCanvas(canvas, 0, 0);
```

**Options:**
- `align`: `'top'|'center'|'bottom'` for HGroup, `'left'|'center'|'right'` for VGroup
- `width` (HGroup) / `height` (VGroup): when set, children get equal shares (remainder to first N)
- `gap`: uniform spacing between children (in columns for HGroup, rows for VGroup)

**Benefits:**
- No manual `(x, y)` positioning per child — position the whole composed tree once
- Automatic size calculation and alignment
- Nested groups for arbitrarily complex layouts
- Works with all kumbu features: overlays, dirty regions, etc.

**Known limitation (v1):** All children get equal space when a group has fixed width/height — no per-child "stay natural" override yet (would need per-child `flex` flags).

## Examples

Run any example with `bun`:

```bash
bun packages/kumbu/examples/01-basic-canvas.js        # Positioned rendering and layering
bun packages/kumbu/examples/02-layers-overlay.js      # Overlays and transparency
bun packages/kumbu/examples/03-groups.js              # HGroup/VGroup compositional layout
bun packages/kumbu/examples/04-viewport-scrolling.js  # Interactive viewport with keyboard control
bun packages/kumbu/examples/05-dirty-regions.js       # Interactive dirty region tracking demo
bun packages/kumbu/examples/06-dual-viewports.js      # Dual independent scrolling viewports
bun packages/kumbu/examples/07-multi-layer-dashboard.js # Multi-layer dashboard with panels and modals
```

**Example 1 (Basic Canvas):** Demonstrates positioned rendering of styled blocks on a canvas with multiple layers.

**Example 2 (Layers & Overlays):** Shows how to layer content and use transparent overlays for modals/floating elements.

**Example 3 (Groups):** Demonstrates declarative composition with HGroup/VGroup (natural sizing and fixed-width equal distribution).

**Example 4 (Viewport Scrolling):** Interactive fullscreen viewport with keyboard control. Use UP/↓ arrow keys to scroll through content. Demonstrates kumbu viewport scrolling with singi terminal integration.

**Example 5 (Dirty Regions):** Interactive fullscreen demo of dirty region tracking. Press 1/2/3 to update different panels and watch the dirty regions display. Shows efficient terminal updates with all UI contained in the canvas.

**Example 6 (Dual Viewports):** Interactive fullscreen demonstration of two independent side-by-side scrollable viewports. Use w/s to scroll LEFT column and UP/↓ to scroll RIGHT column. Shows how kumbu handles multiple concurrent viewport interactions on the same canvas.

**Example 7 (Multi-Layer Dashboard):** Complete dashboard example demonstrating kumbu's layering system. Features a main viewport with scrollable content (base layer), a side panel (panels layer), and a modal overlay (overlay layer). Use UP/↓ to scroll, 'p' to toggle panel visibility, 'm' to show/hide modal. Shows how independent layers can be composed into a real-world TUI application.

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
