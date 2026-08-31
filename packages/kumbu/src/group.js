// @ts-check

import { splitLines, joinLines, alignLine, joinHorizontal, joinVertical } from '@yowazi/rangi';
import { stringWidth } from '@yowazi/singi';
import { Component } from './component.js';

/**
 * @typedef {import('./component').Component} Component
 */

/**
 * HGroup: Horizontal composition container, now a Component.
 *
 * Arranges children left-to-right with automatic sizing and positioning.
 * When width is null, children keep natural size (passthrough to joinHorizontal).
 * When width is set, children get equal shares (remainder distributed to first N).
 *
 * Extends Component to support focus routing and mouse hit-testing on child components.
 * Containers themselves are never focusable.
 */
export class HGroup extends Component {
  /**
   * @param {Array<string | Component | {render(): string}>} children - Mix of strings, Components, or duck-typed renderables
   * @param {{align?: 'top'|'center'|'bottom', width?: number|null, gap?: number}} options
   */
  constructor(children, options = {}) {
    super();
    const { align = 'top', width = null, gap = 0 } = options;
    this.children = children || [];
    this.align = align;
    this.width = width;
    this.gap = gap;

    /** @type {{child: any, rect: {x: number, y: number, width: number, height: number}}[]} */
    this._childRects = [];
  }

  /**
   * Render the group to a string (no positioning).
   * Resolves all children recursively, then composes horizontally.
   * Also computes _childRects for mouse hit-testing.
   *
   * @param {Record<string, any>} [props={}]
   * @returns {string}
   */
  render(props = {}) {
    if (this.children.length === 0) return '';

    // Resolve all children to strings
    const rendered = this.children.map(child => {
      if (typeof child === 'string') return child;
      if (child && typeof child.render === 'function') return child.render(props);
      return '';
    });

    // Compute child rects for mouse hit-testing (natural-sizing mode)
    this._childRects = [];

    // If width is not set, use natural sizing (passthrough to joinHorizontal)
    if (this.width === null) {
      // Build the rendered + gaps list first (to track positions)
      let toCompose = rendered;
      if (this.gap > 0) {
        const spacer = ' '.repeat(this.gap);
        const spaced = [];
        for (let i = 0; i < rendered.length; i++) {
          if (i > 0) spaced.push(spacer);
          spaced.push(rendered[i]);
        }
        toCompose = spaced;
      }

      // Compute x-offsets for each rendered block (before joinHorizontal)
      let x = 0;
      for (let i = 0; i < toCompose.length; i++) {
        const width = Math.max(...splitLines(toCompose[i]).map(line => stringWidth(line)), 0);
        const childIdx = this.gap > 0 ? Math.floor(i / 2) : i; // Account for spacer interleaving
        const isGap = this.gap > 0 && i % 2 === 1;

        if (!isGap && childIdx < this.children.length) {
          const height = splitLines(toCompose[i]).length;
          this._childRects.push({
            child: this.children[childIdx],
            rect: { x, y: 0, width, height }
          });
        }
        x += width;
      }

      return joinHorizontal(this.align, ...toCompose);
    }

    // Equal-distribution mode: divide width equally among children
    const totalGap = Math.max(0, this.gap * (rendered.length - 1));
    const availableWidth = this.width - totalGap;
    const childWidth = Math.floor(availableWidth / rendered.length);
    const remainder = availableWidth % rendered.length;

    const fitted = rendered.map((block, idx) => {
      const extraCol = idx < remainder ? 1 : 0;
      const targetWidth = childWidth + extraCol;
      return fitBlockWidth(block, targetWidth, 'left');
    });

    // Track child rects in fixed-width mode
    let x = 0;
    fitted.forEach((block, idx) => {
      const width = childWidth + (idx < remainder ? 1 : 0);
      const height = splitLines(block).length;
      this._childRects.push({
        child: this.children[idx],
        rect: { x, y: 0, width, height }
      });
      x += width + this.gap;
    });

    // Insert gap spacers if needed
    if (this.gap > 0) {
      const spacer = ' '.repeat(this.gap);
      const spaced = [];
      for (let i = 0; i < fitted.length; i++) {
        if (i > 0) spaced.push(spacer);
        spaced.push(fitted[i]);
      }
      return joinHorizontal(this.align, ...spaced);
    }

    return joinHorizontal(this.align, ...fitted);
  }

  /**
   * Get child Components only (filter out strings and duck-typed renderables).
   * @param {Record<string, any>} [props={}]
   * @returns {Component[]}
   */
  getChildren(props = {}) {
    return this.children.filter(c => c instanceof Component);
  }

  /**
   * Handle mouse events by finding the child under the click and delegating.
   * @param {Object} event - MouseEvent with x, y already translated to this component's local space
   * @param {Record<string, any>} [props={}]
   * @returns {Object | null | undefined}
   */
  handleMouse(event, props = {}) {
    // Find which child rect contains the point
    for (const { child, rect } of this._childRects) {
      const { x, y, width, height } = rect;
      if (event.x >= x && event.x < x + width && event.y >= y && event.y < y + height) {
        // Translate event to child's local space
        const childEvent = { ...event, x: event.x - x, y: event.y - y };
        if (child && typeof child.handleMouse === 'function') {
          return child.handleMouse(childEvent, props) ?? null;
        }
        return null;
      }
    }
    return null;
  }

  /**
   * Render to canvas at (x, y).
   * @param {import('./canvas').Canvas} canvas
   * @param {number} x
   * @param {number} y
   * @param {string} [layer='base']
   * @param {Record<string, any>} [props={}]
   */
  renderToCanvas(canvas, x, y, layer = 'base', props = {}) {
    const rendered = this.render(props);
    canvas.render(rendered, x, y, layer);
  }
}

/**
 * VGroup: Vertical composition container, now a Component.
 *
 * Arranges children top-to-bottom with automatic sizing and positioning.
 * When height is null, children keep natural size (passthrough to joinVertical).
 * When height is set, children get equal shares (remainder distributed to first N).
 *
 * Extends Component to support focus routing and mouse hit-testing on child components.
 * Containers themselves are never focusable.
 */
export class VGroup extends Component {
  /**
   * @param {Array<string | Component | {render(): string}>} children - Mix of strings, Components, or duck-typed renderables
   * @param {{align?: 'left'|'center'|'right', height?: number|null, gap?: number}} options
   */
  constructor(children, options = {}) {
    super();
    const { align = 'left', height = null, gap = 0 } = options;
    this.children = children || [];
    this.align = align;
    this.height = height;
    this.gap = gap;

    /** @type {{child: any, rect: {x: number, y: number, width: number, height: number}}[]} */
    this._childRects = [];
  }

  /**
   * Render the group to a string (no positioning).
   * Resolves all children recursively, then composes vertically.
   * Also computes _childRects for mouse hit-testing.
   *
   * @param {Record<string, any>} [props={}]
   * @returns {string}
   */
  render(props = {}) {
    if (this.children.length === 0) return '';

    // Resolve all children to strings
    const rendered = this.children.map(child => {
      if (typeof child === 'string') return child;
      if (child && typeof child.render === 'function') return child.render(props);
      return '';
    });

    // Compute child rects for mouse hit-testing
    this._childRects = [];

    // If height is not set, use natural sizing (passthrough to joinVertical)
    if (this.height === null) {
      let toCompose = rendered;
      if (this.gap > 0) {
        // Get max width of rendered blocks for proper blank-line width
        const blockWidth = Math.max(...rendered.flatMap(b => splitLines(b)).map(line => stringWidth(line)), 0);
        const blankLine = ' '.repeat(blockWidth);
        const spacer = joinLines(Array(this.gap).fill(blankLine));

        const spaced = [];
        for (let i = 0; i < rendered.length; i++) {
          if (i > 0) spaced.push(spacer);
          spaced.push(rendered[i]);
        }
        toCompose = spaced;
      }

      // Track child rects for natural-sizing mode
      let y = 0;
      for (let i = 0; i < toCompose.length; i++) {
        const height = splitLines(toCompose[i]).length;
        const width = Math.max(...splitLines(toCompose[i]).map(line => stringWidth(line)), 0);
        const childIdx = this.gap > 0 ? Math.floor(i / 2) : i;
        const isGap = this.gap > 0 && i % 2 === 1;

        if (!isGap && childIdx < this.children.length) {
          this._childRects.push({
            child: this.children[childIdx],
            rect: { x: 0, y, width, height }
          });
        }
        y += height;
      }

      return joinVertical(this.align, ...toCompose);
    }

    // Equal-distribution mode: divide height equally among children
    const totalGap = Math.max(0, this.gap * (rendered.length - 1));
    const availableHeight = this.height - totalGap;
    const childHeight = Math.floor(availableHeight / rendered.length);
    const remainder = availableHeight % rendered.length;

    const fitted = rendered.map((block, idx) => {
      const extraRow = idx < remainder ? 1 : 0;
      const targetHeight = childHeight + extraRow;
      return fitBlockHeight(block, targetHeight);
    });

    // Track child rects in fixed-height mode
    let y = 0;
    fitted.forEach((block, idx) => {
      const height = childHeight + (idx < remainder ? 1 : 0);
      const width = Math.max(...splitLines(block).map(line => stringWidth(line)), 0);
      this._childRects.push({
        child: this.children[idx],
        rect: { x: 0, y, width, height }
      });
      y += height + this.gap;
    });

    // Insert gap spacers if needed
    if (this.gap > 0) {
      const blockWidth = Math.max(...fitted.flatMap(b => splitLines(b)).map(line => stringWidth(line)), 0);
      const blankLine = ' '.repeat(blockWidth);
      const spacer = joinLines(Array(this.gap).fill(blankLine));

      const spaced = [];
      for (let i = 0; i < fitted.length; i++) {
        if (i > 0) spaced.push(spacer);
        spaced.push(fitted[i]);
      }
      return joinVertical(this.align, ...spaced);
    }

    return joinVertical(this.align, ...fitted);
  }

  /**
   * Get child Components only (filter out strings and duck-typed renderables).
   * @param {Record<string, any>} [props={}]
   * @returns {Component[]}
   */
  getChildren(props = {}) {
    return this.children.filter(c => c instanceof Component);
  }

  /**
   * Handle mouse events by finding the child under the click and delegating.
   * @param {Object} event - MouseEvent with x, y already translated to this component's local space
   * @param {Record<string, any>} [props={}]
   * @returns {Object | null | undefined}
   */
  handleMouse(event, props = {}) {
    // Find which child rect contains the point
    for (const { child, rect } of this._childRects) {
      const { x, y, width, height } = rect;
      if (event.x >= x && event.x < x + width && event.y >= y && event.y < y + height) {
        // Translate event to child's local space
        const childEvent = { ...event, x: event.x - x, y: event.y - y };
        if (child && typeof child.handleMouse === 'function') {
          return child.handleMouse(childEvent, props) ?? null;
        }
        return null;
      }
    }
    return null;
  }

  /**
   * Render to canvas at (x, y).
   * @param {import('./canvas').Canvas} canvas
   * @param {number} x
   * @param {number} y
   * @param {string} [layer='base']
   * @param {Record<string, any>} [props={}]
   */
  renderToCanvas(canvas, x, y, layer = 'base', props = {}) {
    const rendered = this.render(props);
    canvas.render(rendered, x, y, layer);
  }
}

/**
 * Fit a block to a specific width (pad right or truncate).
 * Attempts to preserve right-side border characters during truncation.
 * @private
 * @param {string} block
 * @param {number} width
 * @param {'left'|'center'|'right'} align
 * @returns {string}
 */
function fitBlockWidth(block, width, align) {
  const lines = splitLines(block);
  const fitted = lines.map(line => {
    const lineWidth = stringWidth(line);

    // If line is shorter or equal, just align normally
    if (lineWidth <= width) {
      return alignLine(line, width, align);
    }

    // Line is longer than target width - need to truncate
    // For 'left' align, try to preserve right-side border characters
    if (align === 'left') {
      // Check if line ends with a known box border character
      // Common box-drawing chars: │ ┐ ┉ ╮ ┃ ┛ ╯ ┫ ┊ etc.
      const borderChars = /[│┐┉╮┃┛╯┫┊┌└├┤┬┴┼─━═║╔╗╚╝╟╢╞╡╠╣╤╥╦╧╨╩╪╫╬]/;

      // Find the rightmost border character and its position
      let rightBorderPos = -1;
      for (let i = line.length - 1; i >= 0; i--) {
        const char = line[i];
        if (borderChars.test(char)) {
          rightBorderPos = i;
          break;
        }
      }

      // If there's a border character at or near the end, try to preserve it
      if (rightBorderPos >= width - 2) {
        // Border is close to where we'd truncate
        // Truncate just before it
        const beforeBorder = line.substring(0, rightBorderPos);
        const border = line.substring(rightBorderPos);
        const availableForContent = width - stringWidth(border);

        if (availableForContent > 0) {
          // Truncate content to fit border
          const truncated = alignLine(beforeBorder, availableForContent, 'left');
          const result = truncated + border;
          const resultWidth = stringWidth(result);

          if (resultWidth <= width) {
            return alignLine(result, width, 'left');
          }
        }
      }
    }

    // Default: use normal truncation via alignLine
    return alignLine(line, width, align);
  });

  return joinLines(fitted);
}

/**
 * Fit a block to a specific height (truncate from bottom or pad with blank lines).
 * @private
 * @param {string} block
 * @param {number} height
 * @returns {string}
 */
function fitBlockHeight(block, height) {
  const lines = splitLines(block);

  // Get the block's width (max width of all lines)
  const blockWidth = Math.max(...lines.map(line => stringWidth(line)), 0);

  if (lines.length === height) {
    return block; // Already correct height
  }

  if (lines.length > height) {
    // Truncate from bottom
    return joinLines(lines.slice(0, height));
  }

  // Pad with blank lines
  const blankLine = ' '.repeat(blockWidth);
  while (lines.length < height) {
    lines.push(blankLine);
  }

  return joinLines(lines);
}
