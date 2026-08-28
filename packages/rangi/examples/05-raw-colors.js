#!/usr/bin/env node
// @ts-check

/**
 * Example 5: Raw RGB Colors
 *
 * Shows how to use raw RGB colors that bypass theming entirely.
 * Useful for brand colors, custom palettes, or theme-agnostic UI.
 */

import { Style, setTheme } from '@yowazi/rangi';
import { dark, light } from '@yowazi/rangi/themes';

console.log('=== Example 5: Raw RGB Colors ===\n');

// Create styles with raw RGB colors
const brandBlue = new Style().foregroundRGB(66, 135, 245);
const brandGreen = new Style().foregroundRGB(34, 177, 76);
const brandOrange = new Style().foregroundRGB(255, 153, 0);

console.log('Raw RGB colors (theme-agnostic):\n');
console.log('Brand Blue:  ', brandBlue.render('Custom brand color'));
console.log('Brand Green: ', brandGreen.render('Custom brand color'));
console.log('Brand Orange:', brandOrange.render('Custom brand color'));

console.log('\n--- Switching Themes (RGB colors unaffected) ---\n');

// Render the same RGB styles under different themes
setTheme(dark);
console.log('Under dark theme:');
console.log('  Brand Blue:', brandBlue.render('Custom brand color'));

setTheme(light);
console.log('Under light theme:');
console.log('  Brand Blue:', brandBlue.render('Custom brand color'));

console.log('\n--- Combining Semantic and Raw Colors ---\n');

// Mix semantic (theme-aware) and raw (theme-agnostic) colors
const card = new Style()
  .bold()
  .foreground('primary')
  .backgroundRGB(50, 50, 50);

setTheme(dark);
console.log('Card under dark:', card.render('Card Title'));

setTheme(light);
console.log('Card under light:', card.render('Card Title'));

console.log('\n✓ Raw RGB colors work independently of themes!');
