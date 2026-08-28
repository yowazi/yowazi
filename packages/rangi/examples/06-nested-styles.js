#!/usr/bin/env node
// @ts-check

/**
 * Example 6: Nested Styles
 *
 * Demonstrates composing styled text by nesting one style inside another.
 * Uses per-channel close codes to ensure outer styling persists correctly.
 */

import { Style, setTheme } from '@yowazi/rangi';
import { dark } from '@yowazi/rangi/themes';

console.log('=== Example 6: Nested Styles ===\n');

setTheme(dark);

// Create outer and inner styles
const outer = new Style().bold().foreground('primary');
const inner = new Style().italic().foreground('warning');

console.log('Basic nesting:\n');

// Compose text with nested styles
const nested = outer.render(
  `This is outer text with ${inner.render('inner styled text')} and more outer.`
);
console.log(nested);

console.log('\n--- Independent Attributes ---\n');

// Outer bold + inner italic don't interfere
const boldOuter = new Style().bold();
const italicInner = new Style().italic();

const composed = boldOuter.render(
  `Bold outer with ${italicInner.render('italic inner')} and bold again.`
);
console.log(composed);

console.log('\n--- Nested Colors ---\n');

// When colors overlap, inner closes then outer resumes
const redText = new Style().foreground('error');
const greenText = new Style().foreground('primary');

const colorNested = redText.render(
  `Red outer with ${greenText.render('green inner')} back to red.`
);
console.log(colorNested);

console.log('\n--- Deep Nesting ---\n');

// Multiple levels of nesting
const level1 = new Style().foreground('primary');
const level2 = new Style().italic().foreground('warning');
const level3 = new Style().bold().underline();

const deepNested = level1.render(
  `L1 ${level2.render(`L2 ${level3.render('L3')} L2`)} L1`
);
console.log(deepNested);

console.log('\n✓ Nested styles work correctly!');
console.log('Each style closes only its own channels, preserving outer styles.');
