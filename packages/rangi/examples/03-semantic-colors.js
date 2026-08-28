#!/usr/bin/env node
// @ts-check

/**
 * Example 3: Semantic Colors
 *
 * Introduces semantic color roles: primary, secondary, alert, warning, error, default.
 * Uses the current theme's color definitions for a cohesive look.
 */

import { Style, setTheme } from '@yowazi/rangi';
import { dark } from '@yowazi/rangi/themes';

console.log('=== Example 3: Semantic Colors ===\n');

// Use the dark theme (default, but explicit here)
setTheme(dark);

console.log('Semantic color roles:\n');

const examples = [
  { role: 'default', label: 'Default (neutral text)' },
  { role: 'primary', label: 'Primary (main UI elements)' },
  { role: 'secondary', label: 'Secondary (supporting elements)' },
  { role: 'alert', label: 'Alert (important notices)' },
  { role: 'warning', label: 'Warning (caution messages)' },
  { role: 'error', label: 'Error (error messages)' },
];

for (const { role, label } of examples) {
  const foreground = new Style().foreground(role);
  const background = new Style().background(role);

  console.log(`${label}:`);
  console.log(`  Foreground: ${foreground.render('Sample text')}`);
  console.log(`  Background: ${background.render('Sample text')}`);
  console.log();
}

console.log('--- Combining Foreground + Background ---\n');

// Combine foreground and background
const button = new Style()
  .bold()
  .foreground('default')
  .background('default');

console.log('Button style:', button.render('CLICK ME'));

console.log('\n✓ Semantic colors demonstrated!');
