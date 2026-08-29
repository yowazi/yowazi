// @ts-check

// @ts-check

// Public API exports for @yowazi/rangi

export { Style } from './style.js';
export { Theme } from './theme.js';
export { getTheme, setTheme } from './theme-context.js';
export { joinHorizontal, joinVertical } from './composition.js';

// Box model utilities (exported for consumers like kumbu that need line manipulation)
export { splitLines, joinLines, alignLine } from './box.js';

// Built-in themes
export { dark, light, cyber, retro, purple, minimal, transparent } from './themes/index.js';
