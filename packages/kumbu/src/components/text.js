// @ts-check

import { Component } from '../component.js';

/**
 * Text: a simple static or dynamic text component.
 *
 * Renders plain text, optionally computed from props. Not focusable, always inert.
 */
export class Text extends Component {
  /**
   * @param {string | ((props: Record<string, any>) => string)} content - Static string or
   *   a pure function that computes text from props
   * @param {Object} [options={}] - Reserved for future styling options
   */
  constructor(content, options = {}) {
    super();
    this.content = content;
    this.options = options;
  }

  /**
   * Render the text content.
   * @param {Record<string, any>} [props={}]
   * @returns {string}
   */
  render(props = {}) {
    if (typeof this.content === 'function') {
      return this.content(props) ?? '';
    }
    return this.content ?? '';
  }
}
