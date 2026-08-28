#!/usr/bin/env node
// @ts-check

/**
 * Example 2: Text Attributes
 *
 * Showcases all available text attributes in rangi:
 * bold, dim, italic, underline, blink, invert, strike.
 */

import { Style } from '@yowazi/rangi';

console.log('=== Example 2: Text Attributes ===\n');

const examples = [
  { name: 'Bold', style: new Style().bold() },
  { name: 'Dim', style: new Style().dim() },
  { name: 'Italic', style: new Style().italic() },
  { name: 'Underline', style: new Style().underline() },
  { name: 'Blink', style: new Style().blink() },
  { name: 'Invert', style: new Style().invert() },
  { name: 'Strikethrough', style: new Style().strike() },
];

for (const { name, style } of examples) {
  console.log(`${name}:`.padEnd(15), style.render(name));
}

console.log('\n--- Combining Attributes ---\n');

// Show how attributes combine
const combined = new Style()
  .bold()
  .underline();
console.log('Bold + Underline:', combined.render('Combined Attributes'));

console.log('\n✓ All text attributes demonstrated!');
