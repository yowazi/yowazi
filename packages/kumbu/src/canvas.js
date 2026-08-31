// @ts-check

import { stringWidth } from '@yowazi/singi';
import { splitLines, joinLines } from '@yowazi/rangi';
import { parseStyledBlock } from './cell-parser.js';
import { cellsToANSI } from './cell-render.js';
import { Viewport } from './viewport.js';
import { FocusManager } from './focus-manager.js';

/**
 * @typedef {import('./cell-parser').Cell} Cell
 * @typedef {import('./component').Component} Component
 */

/**
 * Canvas: a 2D virtual buffer for rendering positioned content with layers and overlays.
 *
 * The canvas is a grid of cells (width × height), organized into named layers (back to front).
 * Each layer is a Cell[][] grid, initially all-null (transparent). When compositing:
 * - Start with an all-null frame
 * - For each layer in order, overwrite any cell that is non-null in that layer
 * - The topmost non-null cell at each position wins
 */
export class Canvas {
  /**
   * @param {number} width - Canvas width in columns
   * @param {number} height - Canvas height in rows
   */
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Ordered list of named layers: [{ name, grid: Cell[][] }]
    this.layers = [{ name: 'base', grid: this._blankGrid() }];

    // Dirty row tracking: Set<number> of row indices
    this.dirtyRows = new Set();

    // Layer index by name (for fast lookup)
    this.layerIndex = new Map([['base', 0]]);

    // Component system (optional, for interactive applications)
    this.rootComponent = null;
    this.focusManager = new FocusManager();
    this.rootOrigin = { x: 0, y: 0 };
    this.rootLayer = 'base';
  }

  /**
   * Create a blank grid (all null cells) of canvas dimensions.
   * @private
   * @returns {(Cell | null)[][]}
   */
  _blankGrid() {
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      const row = new Array(this.width);
      row.fill(null);
      grid.push(row);
    }
    return grid;
  }

  /**
   * Get or create a named layer.
   * @private
   * @param {string} layerName
   * @returns {(Cell | null)[][]}
   */
  _getLayer(layerName) {
    if (!this.layerIndex.has(layerName)) {
      const grid = this._blankGrid();
      this.layers.push({ name: layerName, grid });
      this.layerIndex.set(layerName, this.layers.length - 1);
      return grid;
    }
    const idx = this.layerIndex.get(layerName);
    return this.layers[idx].grid;
  }

  /**
   * Mark a range of rows as dirty.
   * @private
   * @param {number} minRow
   * @param {number} maxRow - Inclusive
   */
  _markDirty(minRow, maxRow) {
    const startRow = Math.max(0, minRow);
    const endRow = Math.min(this.height - 1, maxRow);
    for (let y = startRow; y <= endRow; y++) {
      this.dirtyRows.add(y);
    }
  }

  /**
   * Render a styled block at a position (opaque — overwrites underlying cells).
   *
   * @param {string} block - Multi-line block (may contain ANSI codes)
   * @param {number} x - Column position (0-based)
   * @param {number} y - Row position (0-based)
   * @param {string} [layerName='base'] - Layer to render to
   */
  render(block, x, y, layerName = 'base') {
    if (!block) return;

    const cells = parseStyledBlock(block);
    if (!cells) return;

    const grid = this._getLayer(layerName);

    let minRow = this.height;
    let maxRow = -1;

    for (let row = 0; row < cells.length; row++) {
      const canvasRow = y + row;
      if (canvasRow < 0 || canvasRow >= this.height) continue;

      minRow = Math.min(minRow, canvasRow);
      maxRow = Math.max(maxRow, canvasRow);

      for (let col = 0; col < cells[row].length; col++) {
        const canvasCol = x + col;
        if (canvasCol < 0 || canvasCol >= this.width) continue;

        grid[canvasRow][canvasCol] = cells[row][col];
      }
    }

    if (maxRow >= minRow) {
      this._markDirty(minRow, maxRow);
    }
  }

  /**
   * Render a styled block with transparency (space+no-bg padding becomes see-through).
   *
   * @param {string} block - Multi-line block
   * @param {number} x - Column position
   * @param {number} y - Row position
   * @param {{layer?: string, transparent?: boolean} } [options={}] - Overlay options
   */
  overlay(block, x, y, options = {}) {
    const { layer = 'base', transparent = true } = options;

    if (!block) return;

    const cells = parseStyledBlock(block);
    if (!cells) return;

    const grid = this._getLayer(layer);

    let minRow = this.height;
    let maxRow = -1;

    for (let row = 0; row < cells.length; row++) {
      const canvasRow = y + row;
      if (canvasRow < 0 || canvasRow >= this.height) continue;

      minRow = Math.min(minRow, canvasRow);
      maxRow = Math.max(maxRow, canvasRow);

      for (let col = 0; col < cells[row].length; col++) {
        const canvasCol = x + col;
        if (canvasCol < 0 || canvasCol >= this.width) continue;

        const cell = cells[row][col];

        // Transparency heuristic: space with no background becomes null
        if (transparent && cell.char === ' ' && !cell.bg) {
          // Write null to make this position see-through
          grid[canvasRow][canvasCol] = null;
        } else {
          // Write the cell (opaque)
          grid[canvasRow][canvasCol] = cell;
        }
      }
    }

    if (maxRow >= minRow) {
      this._markDirty(minRow, maxRow);
    }
  }

  /**
   * Create a new named layer (returns it for chaining).
   *
   * @param {string} name
   * @returns {Canvas} - Returns this for chaining
   */
  addLayer(name) {
    if (!this.layerIndex.has(name)) {
      const grid = this._blankGrid();
      this.layers.push({ name, grid });
      this.layerIndex.set(name, this.layers.length - 1);
    }
    return this;
  }

  /**
   * Create a viewport (scrolling window) into content.
   *
   * @param {number} x - Column position
   * @param {number} y - Row position
   * @param {number} width - Viewport width
   * @param {number} height - Viewport height
   * @returns {Viewport}
   */
  createViewport(x, y, width, height) {
    return new Viewport(this, x, y, width, height);
  }

  /**
   * Get dirty row indices (rows that have been modified since last clear).
   *
   * @returns {number[]} - Sorted array of dirty row indices
   */
  getDirtyRegions() {
    return Array.from(this.dirtyRows).sort((a, b) => a - b);
  }

  /**
   * Clear the dirty region set (call after flushing output).
   */
  clearDirtyRegions() {
    this.dirtyRows.clear();
  }

  /**
   * Composite all layers and convert to ANSI strings.
   * Flattens layers bottom-to-top, with topmost non-null cell winning at each position.
   *
   * @param {{regions?: 'all' | 'dirty'} } [options={}] - Output options
   * @returns {string[]} - Array of ANSI strings, one per row
   */
  toANSI(options = {}) {
    const { regions = 'all' } = options;

    // Build composited frame: start with all-null, layer by layer
    const frame = this._blankGrid();

    for (const { grid } of this.layers) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (grid[y][x] !== null) {
            frame[y][x] = grid[y][x];
          }
        }
      }
    }

    // Convert cells to ANSI strings
    let rowStrings = cellsToANSI(frame);

    // Filter to dirty regions if requested
    if (regions === 'dirty') {
      const dirty = this.getDirtyRegions();
      if (dirty.length === 0) {
        return [];
      }

      // Return only dirty rows as separate strings (one per dirty row)
      return dirty.map(rowIdx => rowStrings[rowIdx] || '');
    }

    // Return all rows
    return rowStrings;
  }

  /**
   * Render canvas to a terminal-ready string with proper newline handling.
   * This prevents scroll offset by not adding a newline after the last row.
   *
   * @param {{regions?: 'all' | 'dirty'} } [options={}] - Output options
   * @returns {string} - Single string ready for process.stdout.write()
   */
  toTerminal(options = {}) {
    const rows = this.toANSI(options);
    if (rows.length === 0) return '';

    // Join all but the last row with newlines
    const allButLast = rows.slice(0, -1).join('\n');
    const last = rows[rows.length - 1];

    // Return without trailing newline to prevent cursor moving below terminal
    return allButLast.length > 0 ? allButLast + '\n' + last : last;
  }

  /**
   * Set a root component (optional, for interactive applications).
   * @param {Component} component - Root component to render and route input to
   * @param {{x?: number, y?: number, layer?: string}} [options={}] - Placement options
   * @returns {Canvas} - Returns this for chaining
   */
  setRootComponent(component, options = {}) {
    const { x = 0, y = 0, layer = 'base' } = options;
    this.rootComponent = component;
    this.rootOrigin = { x, y };
    this.rootLayer = layer;
    return this;
  }

  /**
   * Render the root component tree to the canvas.
   * Must call setRootComponent() first.
   *
   * @param {Record<string, any>} [props={}] - Application props to pass through the tree
   * @returns {Canvas} - Returns this for chaining
   * @throws {Error} if no root component is set
   */
  renderComponent(props = {}) {
    if (!this.rootComponent) {
      throw new Error('Canvas.renderComponent() called without a root component (call setRootComponent() first)');
    }

    // Refresh focus order based on current component tree
    this.focusManager.refresh(this.rootComponent, props);

    // Build render props with focus info
    const renderProps = {
      ...props,
      focusedComponent: this.focusManager.getFocused(),
      focusManager: this.focusManager,
    };

    // Render the root component to a string
    const output = this.rootComponent.render(renderProps);

    // Place it on the canvas using the existing render() method
    this.render(output, this.rootOrigin.x, this.rootOrigin.y, this.rootLayer);

    return this;
  }

  /**
   * Dispatch a keyboard event to the component tree.
   * Routes to the focused component first, bubbles if declined.
   * Built-in Tab/Shift+Tab handling advances focus if the tree doesn't consume Tab.
   *
   * @param {Object} event - KeyEvent from @yowazi/singi
   * @param {Record<string, any>} [props={}] - Application props (for the current frame)
   * @returns {{type: string, payload?: any} | null} - Message from the component tree, or null if unhandled
   */
  dispatchKey(event, props = {}) {
    if (!this.rootComponent) {
      return null;
    }

    const path = this.focusManager.getFocusPath();
    const routeProps = {
      ...props,
      focusedComponent: this.focusManager.getFocused(),
      focusManager: this.focusManager,
    };

    // Walk the path from focused leaf back to root
    for (let i = path.length - 1; i >= 0; i--) {
      const component = path[i];
      const msg = component.handleKey(event, routeProps);
      if (msg !== null && msg !== undefined) {
        return msg;
      }
    }

    // Nothing in the tree wanted it. Check built-in Tab handling.
    if (event.type === 'key') {
      if (event.key === 'tab') {
        const focused = this.focusManager.next();
        return { type: '@@kumbu/focus-changed', payload: { focused } };
      }
      if (event.key === 'shift-tab') {
        const focused = this.focusManager.previous();
        return { type: '@@kumbu/focus-changed', payload: { focused } };
      }
    }

    return null;
  }

  /**
   * Dispatch a mouse event to the component tree.
   * Routes based on coordinate hit-testing; updates focus on press/down.
   *
   * @param {Object} event - MouseEvent from @yowazi/singi (raw terminal coordinates)
   * @param {Record<string, any>} [props={}] - Application props (for the current frame)
   * @returns {{type: string, payload?: any} | null} - Message from the component tree, or null if unhandled
   */
  dispatchMouse(event, props = {}) {
    if (!this.rootComponent) {
      return null;
    }

    // Translate from raw terminal coordinates to root-component-local
    const local = {
      ...event,
      x: event.x - this.rootOrigin.x,
      y: event.y - this.rootOrigin.y,
    };

    const routeProps = {
      ...props,
      focusedComponent: this.focusManager.getFocused(),
      focusManager: this.focusManager,
    };

    // On any button action (press, down, release), find the deepest focusable component under the point and focus it
    if (event.action === 'press' || event.action === 'down' || event.action === 'release') {
      const target = this._findFocusableAt(this.rootComponent, local.x, local.y, routeProps);
      if (target) {
        this.focusManager.focus(target);
      }
    }

    // Route the event to the root component (which will recurse into children)
    return this.rootComponent.handleMouse(local, routeProps) ?? null;
  }

  /**
   * Find the deepest focusable component at a given position (used for mouse focus).
   * @private
   * @param {Component} component
   * @param {number} x - Local coordinate
   * @param {number} y - Local coordinate
   * @param {Record<string, any>} props
   * @returns {Component | null}
   */
  _findFocusableAt(component, x, y, props) {
    // If this component has _childRects (it's a container like HGroup/VGroup),
    // use them for hit-testing to find which child contains the point
    if (component._childRects && Array.isArray(component._childRects)) {
      for (const { child, rect } of component._childRects) {
        const { x: rx, y: ry, width, height } = rect;
        if (x >= rx && x < rx + width && y >= ry && y < ry + height) {
          // Translate coordinates to child's local space and recurse
          const childX = x - rx;
          const childY = y - ry;
          const result = this._findFocusableAt(child, childX, childY, props);
          if (result) return result;
        }
      }
      // No hit in children; check if container itself is focusable (unlikely)
      if (component.isFocusable(props)) {
        return component;
      }
      return null;
    }

    // Leaf component (no _childRects)
    if (component.isFocusable(props)) {
      return component;
    }

    return null;
  }

  /**
   * Get the absolute cursor position for a component.
   * Traverses the component tree to find the cursor position relative to the root.
   *
   * @private
   * @param {Component} component - Target component (should have getCursorPos method)
   * @param {Component} container - Container to search within
   * @param {number} offsetX - Accumulated X offset
   * @param {number} offsetY - Accumulated Y offset
   * @returns {{x: number, y: number} | null} - Absolute cursor position, or null if not found
   */
  _getAbsoluteCursorPos(component, container, offsetX = 0, offsetY = 0) {
    if (container === component) {
      const pos = component.getCursorPos?.({});
      if (pos) {
        return { x: offsetX + pos.x + 1, y: offsetY + pos.y + 1 };
      }
      return null;
    }

    const children = container.getChildren?.({}) || [];
    const rects = container._childRects || [];

    for (let i = 0; i < children.length; i++) {
      const rect = rects.find(r => r.child === children[i]);
      if (rect) {
        const result = this._getAbsoluteCursorPos(
          component,
          children[i],
          offsetX + rect.rect.x,
          offsetY + rect.rect.y
        );
        if (result) return result;
      }
    }
    return null;
  }

  /**
   * Position the terminal cursor for the focused component.
   * If the focused component has a getCursorPos method, position the cursor there.
   * Otherwise hide the cursor.
   *
   * Requires singi's cursorPos and hideCursor/showCursor functions.
   *
   * @param {Object} cursorFunctions - Terminal cursor control functions from singi
   * @param {(row: number, col: number) => string} cursorFunctions.cursorPos - Position cursor
   * @param {() => string} cursorFunctions.showCursor - Show cursor sequence
   * @param {() => string} cursorFunctions.hideCursor - Hide cursor sequence
   * @returns {string} - ANSI escape sequence to position cursor (empty if no focused component)
   */
  getCursorOutput(cursorFunctions) {
    const focused = this.focusManager.getFocused();
    if (!focused || !focused.getCursorPos) {
      return cursorFunctions.hideCursor();
    }

    const pos = this._getAbsoluteCursorPos(focused, this.rootComponent, this.rootOrigin.x, this.rootOrigin.y);
    if (pos) {
      return cursorFunctions.showCursor() + cursorFunctions.cursorPos(pos.y, pos.x);
    }
    return cursorFunctions.hideCursor();
  }
}
