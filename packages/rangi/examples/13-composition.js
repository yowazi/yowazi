#!/usr/bin/env bun

/**
 * Example 13: Composition
 *
 * Demonstrates joinVertical and joinHorizontal for composing blocks.
 */

import { Style, joinVertical, joinHorizontal, dark } from '@yowazi/rangi';

// Force TrueColor for this example
process.env.FORCE_COLOR = '3';

console.log('\n=== Composition: Joining Blocks ===\n');

// 1. Basic vertical joining
console.log('1. joinVertical with different alignments:');

const box1 = new Style().border('normal').padding(1).render('Box 1');
const box2 = new Style().border('normal').padding(1).render('Box 2 - longer');
const box3 = new Style().border('normal').padding(1).render('B3');

console.log('Left-aligned:');
console.log(joinVertical('left', box1, box2, box3));
console.log();

console.log('Center-aligned:');
console.log(joinVertical('center', box1, box2, box3));
console.log();

console.log('Right-aligned:');
console.log(joinVertical('right', box1, box2, box3));
console.log();

// 2. Basic horizontal joining
console.log('2. joinHorizontal with different alignments:');

const vbox1 = new Style().border('normal').render('A\nB');
const vbox2 = new Style().border('normal').render('C\nD\nE');
const vbox3 = new Style().border('normal').render('F');

console.log('Top-aligned:');
console.log(joinHorizontal('top', vbox1, vbox2, vbox3));
console.log();

console.log('Center-aligned:');
console.log(joinHorizontal('center', vbox1, vbox2, vbox3));
console.log();

console.log('Bottom-aligned:');
console.log(joinHorizontal('bottom', vbox1, vbox2, vbox3));
console.log();

// 3. Combining vertical and horizontal
console.log('3. Combined vertical + horizontal layout:');

const header = new Style()
  .border('double')
  .padding(1, 2)
  .width(50)
  .align('center')
  .foreground('primary')
  .render('Dashboard');

const leftSidebar = new Style()
  .border('normal')
  .padding(1)
  .width(15)
  .render('Menu\nOption 1\nOption 2');

const mainContent = new Style()
  .border('normal')
  .padding(1)
  .render('Main Content\nGoes Here\nWith multiple lines');

const footer = new Style()
  .border('double')
  .padding(0, 2)
  .width(50)
  .align('center')
  .foreground('secondary')
  .render('Footer');

// First, create the header
console.log(header);
console.log();

// Then, create the main body (sidebar + content)
const body = joinHorizontal('top', leftSidebar, mainContent);
console.log(body);
console.log();

// Finally, add the footer
console.log(footer);
console.log();

// 4. Three-column layout
console.log('4. Three-column layout:');

const col1 = new Style()
  .border('rounded')
  .padding(1)
  .width(12)
  .render('Column 1\nData');

const col2 = new Style()
  .border('rounded')
  .padding(1)
  .width(12)
  .render('Column 2\nMore Data');

const col3 = new Style()
  .border('rounded')
  .padding(1)
  .width(12)
  .render('Column 3\nStuff');

console.log(joinHorizontal('top', col1, col2, col3));
console.log();

// 5. Nested composition with colors
console.log('5. Nested composition with semantic colors:');

const statusOk = new Style()
  .border('normal')
  .padding(1)
  .foreground('primary')
  .render('✓ OK');

const statusWarn = new Style()
  .border('normal')
  .padding(1)
  .foreground('warning')
  .render('⚠ Warn');

const statusErr = new Style()
  .border('normal')
  .padding(1)
  .foreground('error')
  .render('✗ Err');

const statusRow = joinHorizontal('center', statusOk, statusWarn, statusErr);
const statusBox = new Style()
  .border('double')
  .padding(1, 2)
  .render(statusRow);

console.log(statusBox);
console.log();

// 6. Stacked with varying widths
console.log('6. Stacked panels with automatic width normalization:');

const wide = new Style()
  .border('normal')
  .padding(1)
  .render('This is the wide one');

const narrow = new Style()
  .border('normal')
  .padding(1)
  .render('Short');

console.log(joinVertical('center', wide, narrow, wide));
console.log();

console.log('=== Composition Complete ===\n');
