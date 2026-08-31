// @ts-check

/**
 * Apply a style configuration object to a Style instance.
 *
 * This is a general-purpose utility for components that need to apply semantic
 * role-based styling. It accepts any rangi Style method name and applies it with
 * the provided value (semantic role name or RGB).
 *
 * Supports two value types:
 * - Semantic role strings: 'primary', 'secondary', 'alert', 'warning', 'error', 'default'
 * - RGB objects: {r: 0-255, g: 0-255, b: 0-255}
 *
 * Auto-border logic: When a base method like 'foreground' is set but its border
 * variant 'borderForeground' is NOT explicitly set in userConfig, the base color
 * automatically applies to both border and content.
 *
 * @param {import('@yowazi/rangi').Style} style - The Style instance to configure
 * @param {Record<string, string|{r:number,g:number,b:number}>} userConfig - User-provided style config
 *   Maps rangi Style method names to semantic roles or RGB values.
 * @param {Record<string, string|{r:number,g:number,b:number}>} [mergedConfig] - Optional merged config
 *   with defaults. Used for applying any properties not explicitly set in userConfig.
 *
 * @returns {import('@yowazi/rangi').Style} The configured Style instance (chainable)
 *
 * @example
 * // Foreground applies to both border and content (auto-border)
 * applyStyleConfig(style, { foreground: 'primary' });
 *
 * // With defaults for anything not specified
 * applyStyleConfig(style,
 *   { foreground: 'primary' },
 *   { foreground: 'primary', background: 'default', borderForeground: 'primary' }
 * );
 */

/**
 * Check if a value is an RGB object with r, g, b properties.
 * @private
 */
function isRGBValue(value) {
  return value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value;
}

/**
 * Apply a single style method to a Style instance, handling both semantic and RGB values.
 * @private
 */
function applyStyleMethod(style, methodName, value) {
  if (isRGBValue(value)) {
    const rgbMethodName = methodName + 'RGB';
    if (typeof style[rgbMethodName] === 'function') {
      return style[rgbMethodName](value.r, value.g, value.b);
    }
  }

  if (typeof style[methodName] === 'function') {
    return style[methodName](value);
  }

  return style;
}

/**
 * Base methods that have border/content variants.
 * Maps base method name to its variants.
 * @private
 */
const STYLE_VARIANTS = {
  foreground: { border: 'borderForeground', content: 'contentForeground' },
  background: { border: 'borderBackground', content: 'contentBackground' }
};

/**
 * Get the border variant name for a base method.
 * @private
 */
function getBorderVariantName(methodName) {
  return STYLE_VARIANTS[methodName]?.border;
}

/**
 * Check if a method name is a border/content variant.
 * @private
 */
function isVariantMethod(methodName) {
  for (const variants of Object.values(STYLE_VARIANTS)) {
    if (methodName === variants.border || methodName === variants.content) {
      return true;
    }
  }
  return false;
}

export function applyStyleConfig(style, userConfig, mergedConfig) {
  if (!userConfig && !mergedConfig) return style;

  if (userConfig) {
    for (const [methodName, value] of Object.entries(userConfig)) {
      style = applyStyleMethod(style, methodName, value);

      // For base methods, also auto-apply to border variant if not explicitly set
      const borderVariant = getBorderVariantName(methodName);
      if (borderVariant && !userConfig[borderVariant]) {
        style = applyStyleMethod(style, borderVariant, value);
      }
    }
  }

  if (mergedConfig) {
    for (const [methodName, value] of Object.entries(mergedConfig)) {
      // Skip if already in userConfig
      if (userConfig && userConfig[methodName]) continue;

      // Skip variant methods if their base method was in userConfig
      let shouldSkip = false;
      if (userConfig && isVariantMethod(methodName)) {
        for (const [baseName, variants] of Object.entries(STYLE_VARIANTS)) {
          if ((methodName === variants.border || methodName === variants.content) && userConfig[baseName]) {
            shouldSkip = true;
            break;
          }
        }
      }
      if (shouldSkip) continue;

      style = applyStyleMethod(style, methodName, value);
    }
  }

  return style;
}
