// @ts-check

/**
 * Style defaults for interactive components.
 *
 * Provides standard, reusable style configurations that any component can use
 * for focused/unfocused states. These can be overridden per-component instance
 * via constructor options.
 *
 * @typedef {Object} StyleConfig
 * @property {Record<string, string|{r:number,g:number,b:number}>} focused - Styles when component has focus
 * @property {Record<string, string|{r:number,g:number,b:number}>} unfocused - Styles when component lacks focus
 */

/**
 * Default style configurations for interactive input components (TextInput, etc.)
 *
 * - Focused: bright primary text/border on default background (draws attention)
 * - Unfocused: muted secondary text/border (visually less prominent, not alarming)
 *
 * @type {StyleConfig}
 */
export const inputDefaults = {
  focused: {
    foreground: 'primary',
    background: 'default',
    borderForeground: 'primary'
  },
  unfocused: {
    foreground: 'secondary',
    background: 'default',
    borderForeground: 'secondary'
  }
};

/**
 * Merge a partial style configuration with defaults.
 *
 * Used by components to allow users to override specific style properties
 * while keeping the rest of the defaults. For example, a TextInput might
 * override just the focused foreground color while keeping the default
 * background and border colors.
 *
 * @param {StyleConfig} defaults - The default configuration
 * @param {Partial<StyleConfig>} [userConfig] - User-provided overrides
 * @returns {StyleConfig} Merged configuration
 *
 * @example
 * const config = mergeStyleDefaults(inputDefaults, {
 *   focused: { foreground: 'alert' }  // Only override focused foreground
 * });
 * // Result: focused has 'alert' foreground but keeps default background/borderForeground
 */
export function mergeStyleDefaults(defaults, userConfig) {
  if (!userConfig) return defaults;

  return {
    focused: { ...defaults.focused, ...(userConfig.focused || {}) },
    unfocused: { ...defaults.unfocused, ...(userConfig.unfocused || {}) }
  };
}
