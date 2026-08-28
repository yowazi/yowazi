#!/usr/bin/env node
// @ts-check

/**
 * Example 7: Per-Style Theme Overrides
 *
 * Shows how to override the global theme for individual styles.
 * Useful for components that need a specific theme regardless of the app's theme.
 */

import { Style, setTheme } from '@yowazi/rangi';
import { dark, light } from '@yowazi/rangi/themes';

console.log('=== Example 7: Per-Style Theme Overrides ===\n');

// Set the global theme to dark
setTheme(dark);
console.log('Global theme: dark\n');

// Create a style that uses the global theme
const globalStyle = new Style().foreground('primary');
console.log('Global style:', globalStyle.render('Uses dark theme'));

// Create a style that overrides to light theme
const lightOverride = new Style()
  .theme(light)
  .foreground('primary');
console.log('Overridden style:', lightOverride.render('Uses light theme'));

console.log('\n--- Practical Use Case ---\n');

// Imagine a dark-mode app with a light-mode dialog box
console.log('Dark app theme:');
const appButton = new Style()
  .bold()
  .foreground('primary')
  .backgroundRGB(40, 40, 40);
console.log('  ' + appButton.render('[Click Me]'));

// Dialog that always uses light theme
console.log('\nLight dialog overlay (even though app is dark):');
const dialogTitle = new Style()
  .theme(light)
  .bold()
  .foreground('primary');
const dialogButton = new Style()
  .theme(light)
  .foreground('default')
  .backgroundRGB(200, 200, 200);

console.log('  ' + dialogTitle.render('Confirm Action'));
console.log('  ' + dialogButton.render('[OK]') + ' ' + dialogButton.render('[Cancel]'));

console.log('\n--- Switching Global Theme ---\n');

// Switch global theme
setTheme(light);
console.log('Global theme: light\n');

console.log('Global style now renders with light theme:');
console.log('  ' + globalStyle.render('Now uses light theme'));

console.log('Overridden style still uses its override (light):');
console.log('  ' + lightOverride.render('Still uses overridden light theme'));

console.log('\n✓ Per-style theme overrides work!');
