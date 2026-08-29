#!/usr/bin/env bun

/**
 * Example 3: HGroup & VGroup
 *
 * Demonstrates declarative compositional layout without manual positioning math.
 */

import { Canvas, HGroup, VGroup } from '@yowazi/kumbu';
import { Style } from '@yowazi/rangi';

process.env.FORCE_COLOR = '3';

console.log('\n=== Kumbu: Declarative Groups ===\n');

// Create a 60x18 canvas
const canvas = new Canvas(60, 18);

// Create styled blocks
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
  .render('Box 1\nContent');

const box2 = new Style()
  .border('rounded')
  .padding(1)
  .render('Box 2\nContent');

const box3 = new Style()
  .border('thick')
  .padding(1)
  .render('Box 3\nContent');

// Section 1: Natural sizing with gap
console.log('Section 1: Natural sizing (HGroup/VGroup with no fixed dimensions)');
console.log('Header + three boxes side-by-side with 2-column gap:\n');

const layout1 = new VGroup(
  [header, new HGroup([box1, box2, box3], { gap: 2 })],
  { gap: 1 }
);

layout1.renderToCanvas(canvas, 2, 0);
console.log(canvas.toANSI().join('\n'));

// Section 2: Fixed-width distribution
console.log('\n\nSection 2: Fixed-width equal distribution');
console.log('Three boxes forced to equal widths (20 cols each):\n');

const canvas2 = new Canvas(62, 10);

const equalBox1 = new Style()
  .border('normal')
  .padding(1)
  .render('Short');

const equalBox2 = new Style()
  .border('rounded')
  .padding(1)
  .render('Medium content here');

const equalBox3 = new Style()
  .border('thick')
  .padding(1)
  .render('This is much longer content that takes up space');

const layout2 = new HGroup([equalBox1, equalBox2, equalBox3], { width: 60, gap: 1 });
layout2.renderToCanvas(canvas2, 1, 0);

console.log(canvas2.toANSI().join('\n'));

console.log('\n=== Groups Complete ===\n');
