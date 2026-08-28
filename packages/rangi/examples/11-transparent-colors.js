#!/usr/bin/env node
// @ts-check

/**
 * Example 11: Transparent Colors
 *
 * Demonstrates using null/transparent background colors in themes.
 * Transparent backgrounds don't override the terminal's background,
 * allowing the underlying color to show through.
 *
 * This is useful for overlays and UI elements that should inherit
 * the terminal's background instead of setting their own.
 */

import { Style, setTheme } from '@yowazi/rangi';
import { transparent, dark } from '@yowazi/rangi/themes';

console.log('=== Example 11: Transparent Colors ===\n');

// Style with colored text but transparent (null) background
setTheme(transparent);

const title = new Style()
  .bold()
  .foreground('primary');

const success = new Style()
  .foreground('primary');

const warning = new Style()
  .foreground('warning');

const error = new Style()
  .foreground('error');

// Show how transparent backgrounds work
console.log(title.render('Transparent Background Example'));
console.log('');
console.log('Text with transparent background (inherits terminal background):');
console.log('  ' + success.render('✓ Success message'));
console.log('  ' + warning.render('⚠ Warning message'));
console.log('  ' + error.render('✗ Error message'));
console.log('');

// Compare with a theme that has opaque backgrounds
console.log('Comparison with dark theme (has background colors):');
setTheme(dark);

const darkSuccess = new Style()
  .foreground('primary')
  .background('primary');

const darkWarning = new Style()
  .foreground('warning')
  .background('warning');

const darkError = new Style()
  .foreground('error')
  .background('error');

console.log('  ' + darkSuccess.render('✓ Success with background'));
console.log('  ' + darkWarning.render('⚠ Warning with background'));
console.log('  ' + darkError.render('✗ Error with background'));
console.log('');

console.log('Key insight:');
console.log('  • Transparent: text color changes, background stays terminal default');
console.log('  • Opaque: both text and background change');
console.log('  • Use transparent for overlays that should adapt to any terminal');
