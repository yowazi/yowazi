// @ts-check

import { Component } from '../component.js';

/**
 * Spacer: a simple component for adding whitespace (padding/gaps).
 *
 * Renders a block of spaces with specified width and/or height.
 * Not focusable, always inert.
 */
export class Spacer extends Component {
  /**
   * @param {Object} [options={}]
   * @param {number} [options.width=0] - Width in columns
   * @param {number} [options.height=0] - Height in rows
   */
  constructor(options = {}) {
    super();
    const { width = 0, height = 0 } = options;
    this.width = width;
    this.height = height;
  }

  /**
   * Render the spacer as a block of spaces.
   * @param {Record<string, any>} [props={}]
   * @returns {string}
   */
  render(props = {}) {
    if (this.height > 0) {
      // Multi-line spacer: height rows of spaces
      return Array.from({ length: this.height }, () => ' '.repeat(this.width)).join('\n');
    }
    // Single-line spacer: just spaces
    return ' '.repeat(this.width);
  }
}
