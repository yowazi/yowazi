#!/usr/bin/env node
// @ts-check

/**
 * Example 1: Basic Styling
 *
 * Shows how to create and render basic styled text with rangi.
 * Demonstrates the Style builder's fluent API and render() method.
 */

import { Style } from '@yowazi/rangi';

console.log('=== Example 1: Basic Styling ===\n');

// Create a basic style with bold text
const bold = new Style().bold();
console.log(bold.render('This is bold text'));

// Create italic text
const italic = new Style().italic();
console.log(italic.render('This is italic text'));

// Create underlined text
const underline = new Style().underline();
console.log(underline.render('This is underlined text'));

// Combine multiple attributes
const fancy = new Style()
  .bold()
  .italic()
  .underline();
console.log(fancy.render('This is bold, italic, and underlined'));

console.log('\n✓ All basic styles rendered!');
