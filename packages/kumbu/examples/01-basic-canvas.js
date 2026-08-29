#!/usr/bin/env bun

/**
 * Example 1: Basic Canvas
 *
 * Demonstrates rendering positioned blocks on a canvas.
 */

import { Canvas } from '@yowazi/kumbu';
import { Style } from '@yowazi/rangi';

// Force TrueColor for this example
process.env.FORCE_COLOR = '3';

console.log('\n=== Kumbu: Basic Canvas ===\n');

// Create a 60x14 canvas
const canvas = new Canvas(60, 14);

// Create some styled blocks
const header = new Style()
  .border('double')
  .padding(1, 2)
  .width(56)
  .align('center')
  .foreground('primary')
  .render('Dashboard');

const box1 = new Style()
  .border('normal')
  .padding(1)
  .width(16)
  .render('Box 1\nContent');

const box2 = new Style()
  .border('rounded')
  .padding(1)
  .width(16)
  .render('Box 2\nContent');

const box3 = new Style()
  .border('thick')
  .padding(1)
  .width(16)
  .render('Box 3\nContent');

// Render blocks at non-overlapping positions
canvas.render(header, 2, 0);
canvas.render(box1, 2, 5);
canvas.render(box2, 20, 5);
canvas.render(box3, 38, 5);

// Output the canvas
console.log(canvas.toANSI().join('\n'));

console.log('\n=== Canvas Complete ===\n');
