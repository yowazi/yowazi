// @ts-check

import { splitLines, joinLines, alignLine } from '@yowazi/rangi';

/**
 * Viewport: a scrollable window into a tall block of content.
 *
 * Stores full content, maintains scroll offset, and renders only the visible portion
 * to the canvas at the given position.
 */
export class Viewport {
  /**
   * @param {import('./canvas').Canvas} canvas - Canvas to render to
   * @param {number} x - Column position on canvas
   * @param {number} y - Row position on canvas
   * @param {number} width - Viewport width in columns
   * @param {number} height - Viewport height in rows
   */
  constructor(canvas, x, y, width, height) {
    this.canvas = canvas;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.content = '';
    this.offset = 0; // Current scroll offset (row index into content)
  }

  /**
   * Set the full content block (may be taller than viewport).
   *
   * @param {string} block - Multi-line block
   */
  setContent(block) {
    this.content = block;
    this.offset = 0;
    this._repaint();
  }

  /**
   * Scroll to a given offset (in rows).
   * Clamps to valid range: [0, max(0, totalLines - viewportHeight)].
   *
   * @param {number} offset - New scroll offset
   */
  scroll(offset) {
    const lines = splitLines(this.content);
    const maxOffset = Math.max(0, lines.length - this.height);
    this.offset = Math.max(0, Math.min(offset, maxOffset));
    this._repaint();
  }

  /**
   * Repaint the viewport on the canvas.
   * @private
   */
  _repaint() {
    if (!this.content) {
      // Render blank viewport
      const blank = ' '.repeat(this.width);
      const blankLines = Array(this.height).fill(blank).join('\n');
      this.canvas.render(blankLines, this.x, this.y);
      return;
    }

    const lines = splitLines(this.content);
    const startLine = this.offset;
    const endLine = Math.min(startLine + this.height, lines.length);

    // Get visible lines and fit to viewport width
    const visibleLines = [];
    for (let i = startLine; i < endLine; i++) {
      const line = lines[i];
      const fitted = alignLine(line, this.width, 'left');
      visibleLines.push(fitted);
    }

    // Pad with blank lines if content is shorter than viewport
    while (visibleLines.length < this.height) {
      visibleLines.push(' '.repeat(this.width));
    }

    const rendered = joinLines(visibleLines);
    this.canvas.render(rendered, this.x, this.y);
  }
}
