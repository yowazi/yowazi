// @ts-check

/**
 * @yowazi/kumbu - Virtual buffer canvas for positioned rendering, layers, and overlays.
 * Includes a Component protocol for interactive applications, HGroup/VGroup for
 * declarative compositional layout, focus management, and event routing.
 *
 * Built-in components:
 * - Text: Static text content
 * - Spacer: Spacing and layout filler
 * - TextInput: Basic single-line text input
 *
 * For more advanced interactive components, see @yowazi/semu.
 */

export { Canvas } from './canvas.js';
export { HGroup, VGroup } from './group.js';
export { Component } from './component.js';
export { FocusManager } from './focus-manager.js';
export { Text } from './components/text.js';
export { Spacer } from './components/spacer.js';
export { TextInput } from './components/text-input.js';
export { applyStyleConfig } from './style-config.js';
export { inputDefaults, mergeStyleDefaults } from './style-defaults.js';
