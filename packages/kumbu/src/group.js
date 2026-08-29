// @ts-check

import { splitLines, joinLines, alignLine, joinHorizontal, joinVertical } from '@yowazi/rangi';
import { stringWidth } from '@yowazi/singi';

/**
 * HGroup: Horizontal composition container
 *
 * Arranges children left-to-right with automatic sizing and positioning.
 * When width is null, children keep natural size (passthrough to joinHorizontal).
 * When width is set, children get equal shares (remainder distributed to first N).
 */
export class HGroup {
  /**
   * @param {Array<string | HGroup | VGroup>} children
   * @param {{align?: 'top'|'center'|'bottom', width?: number|null, gap?: number}} options
   */
  constructor(children, options = {}) {
    const { align = 'top', width = null, gap = 0 } = options;
    this.children = children || [];
    this.align = align;
    this.width = width;
    this.gap = gap;
  }

  /**
   * Render the group to a string (no positioning).
   * Resolves all children recursively, then composes horizontally.
   * @returns {string}
   */
  render() {
    if (this.children.length === 0) return '';

    // Resolve all children to strings
    const rendered = this.children.map(child => {
      if (typeof child === 'string') return child;
      if (child && typeof child.render === 'function') return child.render();
      return '';
    });

    // If width is not set, use natural sizing (passthrough to joinHorizontal)
    if (this.width === null) {
      // Insert gap spacers if needed
      if (this.gap > 0) {
        const spacer = ' '.repeat(this.gap);
        const spaced = [];
        for (let i = 0; i < rendered.length; i++) {
          if (i > 0) spaced.push(spacer);
          spaced.push(rendered[i]);
        }
        return joinHorizontal(this.align, ...spaced);
      }
      return joinHorizontal(this.align, ...rendered);
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
   * Render to canvas at (x, y).
   * @param {import('./canvas').Canvas} canvas
   * @param {number} x
   * @param {number} y
   * @param {string} [layer='base']
   */
  renderToCanvas(canvas, x, y, layer = 'base') {
    const rendered = this.render();
    canvas.render(rendered, x, y, layer);
  }
}

/**
 * VGroup: Vertical composition container
 *
 * Arranges children top-to-bottom with automatic sizing and positioning.
 * When height is null, children keep natural size (passthrough to joinVertical).
 * When height is set, children get equal shares (remainder distributed to first N).
 */
export class VGroup {
  /**
   * @param {Array<string | HGroup | VGroup>} children
   * @param {{align?: 'left'|'center'|'right', height?: number|null, gap?: number}} options
   */
  constructor(children, options = {}) {
    const { align = 'left', height = null, gap = 0 } = options;
    this.children = children || [];
    this.align = align;
    this.height = height;
    this.gap = gap;
  }

  /**
   * Render the group to a string (no positioning).
   * Resolves all children recursively, then composes vertically.
   * @returns {string}
   */
  render() {
    if (this.children.length === 0) return '';

    // Resolve all children to strings
    const rendered = this.children.map(child => {
      if (typeof child === 'string') return child;
      if (child && typeof child.render === 'function') return child.render();
      return '';
    });

    // If height is not set, use natural sizing (passthrough to joinVertical)
    if (this.height === null) {
      // Insert gap spacers if needed
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
        return joinVertical(this.align, ...spaced);
      }
      return joinVertical(this.align, ...rendered);
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
   * Render to canvas at (x, y).
   * @param {import('./canvas').Canvas} canvas
   * @param {number} x
   * @param {number} y
   * @param {string} [layer='base']
   */
  renderToCanvas(canvas, x, y, layer = 'base') {
    const rendered = this.render();
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
