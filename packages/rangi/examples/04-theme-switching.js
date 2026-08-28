#!/usr/bin/env node
// @ts-check

/**
 * Example 4: Theme Switching
 *
 * Demonstrates how the same Style renders differently under different themes.
 * Themes are global and affect all subsequent renders.
 */

import { Style, setTheme } from '@yowazi/rangi';
import { dark, light } from '@yowazi/rangi/themes';

console.log('=== Example 4: Theme Switching ===\n');

// Create some semantic styles
const heading = new Style().bold().foreground('primary');
const error = new Style().foreground('error');
const warning = new Style().foreground('warning');

// Render under dark theme
console.log('--- Dark Theme ---\n');
setTheme(dark);

console.log('Heading:', heading.render('Welcome to Rangi'));
console.log('Error:  ', error.render('Something went wrong'));
console.log('Warning:', warning.render('This is a warning'));

console.log('\n--- Light Theme ---\n');

// Switch to light theme
setTheme(light);

// Same styles, different colors!
console.log('Heading:', heading.render('Welcome to Rangi'));
console.log('Error:  ', error.render('Something went wrong'));
console.log('Warning:', warning.render('This is a warning'));

console.log('\n--- Back to Dark ---\n');

// Switch back
setTheme(dark);
console.log('Heading:', heading.render('Welcome to Rangi'));

console.log('\n✓ Theme switching works!');
console.log('Note: The same Style object renders with different colors');
console.log('depending on the active global theme.');
