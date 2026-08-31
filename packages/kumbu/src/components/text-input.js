// @ts-check

import { Component } from '../component.js';
import { Style } from '@yowazi/rangi';
import { applyStyleConfig } from '../style-config.js';
import { inputDefaults, mergeStyleDefaults } from '../style-defaults.js';

/**
 * TextInput: A basic single-line text input component.
 *
 * Features:
 * - Keyboard input with character limit
 * - Mouse click to focus
 * - Visual feedback for focused/unfocused state
 * - Cursor positioning support
 * - Accepts all printable characters
 * - Customizable semantic role styling (via rangi Style methods)
 *
 * This is a simple, foundation-level component. For more advanced text inputs
 * (multiline, validation, etc.), see @yowazi/semu.
 *
 * @example
 * const input = new TextInput({maxLength: 40});
 * const styled = new TextInput({
 *   maxLength: 40,
 *   focused: { foreground: 'primary', borderForeground: 'primary' },
 *   unfocused: { foreground: 'secondary', borderForeground: 'secondary' }
 * });
 */
export class TextInput extends Component {
  /**
   * @param {{
   *   maxLength?: number,
   *   align?: 'left'|'center'|'right',
   *   focused?: Record<string, string|{r:number,g:number,b:number}>,
   *   unfocused?: Record<string, string|{r:number,g:number,b:number}>
   * }} options - Layout config and styling
   *
   * Styling objects map rangi Style method names (e.g. 'foreground', 'background',
   * 'borderForeground') to semantic role names (e.g. 'primary', 'secondary') or RGB
   * objects. Default focused uses 'primary' for text/border, 'default' for background;
   * unfocused uses 'secondary' for all.
   */
  constructor(options = {}) {
    super();
    this.value = '';
    this.maxLength = options.maxLength || 40;
    this.align = options.align || 'left';

    // Store the original user-provided configs for later use in render()
    this.userFocusedConfig = options.focused;
    this.userUnfocusedConfig = options.unfocused;

    // Merge user-provided style config with shared defaults
    const styleConfig = mergeStyleDefaults(inputDefaults, {
      focused: options.focused,
      unfocused: options.unfocused
    });

    this.focused = styleConfig.focused;
    this.unfocused = styleConfig.unfocused;
  }

  /**
   * Render the text input with border and optional text.
   * Styling (colors, borders) changes based on focus state using semantic roles.
   *
   * @param {Record<string, any>} props - Must include focusedComponent for focus detection
   * @returns {string} ANSI-encoded output
   */
  render(props = {}) {
    const isFocused = props.focusedComponent === this;
    const displayText = this.value || '';

    // Build style with base layout
    let style = new Style()
      .border('normal')
      .padding(0)
      .width(this.maxLength + 2)
      .align(this.align);

    // Get user config and merged defaults
    const userConfig = isFocused ? this.userFocusedConfig : this.userUnfocusedConfig;
    const mergedConfig = isFocused ? this.focused : this.unfocused;

    // Apply styling: userConfig tells applyStyleConfig what to auto-apply to both border+content,
    // mergedConfig provides defaults for anything not explicitly set
    style = applyStyleConfig(style, userConfig, mergedConfig);

    return style.render(displayText);
  }

  /**
   * Text inputs are always focusable.
   * @returns {boolean}
   */
  isFocusable(props) {
    return true;
  }

  /**
   * Handle keyboard input: accept printable characters and backspace.
   * Decline navigation keys (Tab, arrows) to allow parent container to handle them.
   *
   * @param {Object} event - KeyEvent from singi
   * @param {Record<string, any>} props
   * @returns {{type: string} | null}
   */
  handleKey(event, props) {
    // Backspace: delete last character
    if (event.key === 'backspace') {
      if (this.value.length > 0) {
        this.value = this.value.slice(0, -1);
      }
      return null;  // Don't emit a message; this is local state
    }

    // Accept single printable characters (up to maxLength)
    if (event.key && event.key.length === 1 && this.value.length < this.maxLength) {
      this.value += event.key;
      return null;
    }

    // Decline everything else (Tab, arrows, Ctrl+C, etc.)
    // These bubble up to parent for navigation and app-level handling
    return null;
  }

  /**
   * Mouse events are handled by Canvas focus mechanism.
   * This component doesn't need to process them.
   *
   * @returns {null}
   */
  handleMouse(event, props) {
    return null;
  }

  /**
   * Provide cursor position within this component's rendered output.
   * For a text input, the cursor appears after the typed text, within the box bounds.
   *
   * Layout (3 lines):
   *   Line 0: top border    ┌───────────┐
   *   Line 1: text line  ←  │text here  │  ← CURSOR HERE
   *   Line 2: bottom border └───────────┘
   *
   * @returns {{x: number, y: number}}
   */
  getCursorPos(props) {
    // Cursor X: 1 (left border) + text length, capped at maxLength
    const cursorX = Math.min(1 + this.value.length, this.maxLength);
    // Cursor Y: line 1 (the text content line)
    const cursorY = 1;

    return { x: cursorX, y: cursorY };
  }
}
