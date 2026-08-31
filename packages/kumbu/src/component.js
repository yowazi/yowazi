// @ts-check

/**
 * @typedef {Object} Message
 * @property {string} type - Message type identifier
 * @property {any} [payload] - Optional message payload
 */

/**
 * Component: the base protocol for all renderable, interactive elements in kumbu.
 *
 * The Component contract is state-agnostic: components receive props from their caller
 * (per-frame application data), render themselves, and emit messages on user input.
 * No component state is stored or managed by kumbu — that's left to whatever drives
 * the component tree (an app loop, kini, Redux, etc.).
 *
 * Components are long-lived across frames: build the tree once, call render(props)
 * on the same instances every frame with fresh props. This is required for focus
 * identity tracking (FocusManager holds object references to track the currently
 * focused component across renders).
 */
export class Component {
  /**
   * Render this component to an ANSI string.
   *
   * @param {Record<string, any>} [props={}] - Per-frame application data (read-only, never mutated)
   * @returns {string} - ANSI-encoded output, built via @yowazi/rangi Style/composition
   * @throws {Error} - Base class throws; subclasses must override
   */
  render(props) {
    throw new Error(`${this.constructor.name}.render() must be implemented`);
  }

  /**
   * Handle a keyboard input event (optional).
   *
   * @param {Object} event - KeyEvent from @yowazi/singi
   * @param {string} event.type - Always 'key'
   * @param {string} event.key - Key name (e.g. 'a', 'up', 'tab', 'enter', 'ctrl-c')
   * @param {boolean} [event.ctrl] - Ctrl modifier (only present when true)
   * @param {boolean} [event.shift] - Shift modifier (only present when true)
   * @param {boolean} [event.alt] - Alt modifier (only present when true)
   * @param {Record<string, any>} [props={}] - Same props passed to render()
   * @returns {Message | null | undefined} - Return a message if this component consumed
   *   the key; return null/undefined to decline (bubble to parent). Kumbu's built-in
   *   Tab/Shift+Tab focus navigation only runs if the entire component tree declines the Tab key.
   */
  handleKey(event, props) {
    return null;
  }

  /**
   * Handle a mouse input event (optional).
   *
   * @param {Object} event - MouseEvent from @yowazi/singi, already translated to this
   *   component's local coordinate space (top-left is 0,0)
   * @param {string} event.type - Always 'mouse'
   * @param {number} event.x - Column (0-based, relative to this component's top-left)
   * @param {number} event.y - Row (0-based, relative to this component's top-left)
   * @param {string} event.button - 'left'|'middle'|'right'|'scroll'|'unknown'
   * @param {string} event.action - 'press'|'release'|'move'|'up'|'down'
   * @param {Record<string, any>} [props={}] - Same props passed to render()
   * @returns {Message | null | undefined} - Return a message if handled; null/undefined to decline
   */
  handleMouse(event, props) {
    return null;
  }

  /**
   * Whether this component can receive keyboard focus (and thus appear in the tab order).
   *
   * @param {Record<string, any>} [props={}] - Same props passed to render()
   * @returns {boolean} - Default: false (inheritors should override if focusable)
   */
  isFocusable(props) {
    return false;
  }

  /**
   * Return this component's child components (for focus traversal and event routing).
   *
   * Non-Component children (e.g. plain strings, objects with a .render() method but not
   * Component instances) are automatically filtered out — only Component instances appear
   * in the focus order.
   *
   * @param {Record<string, any>} [props={}] - Same props passed to render()
   * @returns {Component[]} - Array of child components (default: [])
   */
  getChildren(props) {
    return [];
  }

  /**
   * Get the cursor position within this component's rendered output (optional).
   *
   * Called only when this component is focused and cursor positioning is enabled.
   * Allows components to explicitly specify where the text cursor should appear.
   *
   * @param {Record<string, any>} [props={}] - Same props passed to render()
   * @returns {{x: number, y: number} | null | undefined} - Cursor position relative to this
   *   component's top-left (0-indexed), or null/undefined if this component doesn't manage cursor
   *   (default: null). The Canvas will translate to absolute terminal coordinates.
   */
  getCursorPos(props) {
    return null;
  }
}
