#!/usr/bin/env bun

/**
 * Example 2: Layers and Overlays
 *
 * Demonstrates layering with overlays (modals on top of content).
 */

import { Canvas } from '@yowazi/kumbu';
import { Style } from '@yowazi/rangi';

process.env.FORCE_COLOR = '3';

console.log('\n=== Kumbu: Layers and Overlays ===\n');

const canvas = new Canvas(60, 18);

// Background content
const bgHeader = new Style()
  .border('double')
  .padding(1, 2)
  .width(56)
  .align('center')
  .foreground('primary')
  .render('Background Layer');

const bgBox = new Style()
  .border('normal')
  .padding(1)
  .width(56)
  .render('Content in background\nLine 2\nLine 3\nLine 4');

// Render base layer
canvas.render(bgHeader, 2, 0);
canvas.render(bgBox, 2, 5);

// Overlay layer: modal with transparent padding
const modal = new Style()
  .border('rounded')
  .padding(1, 2)
  .width(28)
  .align('center')
  .bold()
  .foreground('alert')
  .render('Confirm?\n\nProceed?');

// Add overlay layer and render modal
canvas.addLayer('overlay');
canvas.overlay(modal, 16, 7, { layer: 'overlay', transparent: true });

// Output
console.log(canvas.toANSI().join('\n'));

console.log('\n=== Overlay Rendered (modal on top) ===\n');
