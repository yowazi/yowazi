// @ts-check

import { stringWidth } from '@yowazi/singi';
import { splitLines, joinLines } from '@yowazi/rangi';
import { parseStyledBlock } from './cell-parser.js';
import { cellsToANSI } from './cell-render.js';
import { Viewport } from './viewport.js';

/**
 * @typedef {import('./cell-parser').Cell} Cell
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
}
