#!/usr/bin/env node
// @ts-check

/**
 * Example 8: Complete Example
 *
 * A more realistic example showing rangi used together:
 * A simple terminal status display with themed elements.
 */

import { Style, setTheme } from '@yowazi/rangi';
import { dark } from '@yowazi/rangi/themes';
import { stringWidth, getTerminalSize } from '@yowazi/singi';

console.log('=== Example 8: Complete Example - Status Display ===\n');

setTheme(dark);

// Define reusable styles
const header = new Style()
  .bold()
  .foreground('primary');

const success = new Style()
  .foreground('primary');

const warning = new Style()
  .foreground('warning');

const error = new Style()
  .foreground('error');

const muted = new Style()
  .dim()
  .foreground('secondary');

const highlight = new Style()
  .bold()
  .italic()
  .foreground('primary');

// Render a status display
const titleText = 'Application Status Report';
const borderWidth = getTerminalSize().width - 2;
const titleVisualWidth = stringWidth(titleText);
const totalPadding = borderWidth - titleVisualWidth;
const leftPad = Math.floor(totalPadding / 2);
const rightPad = totalPadding - leftPad;

console.log('');
console.log(header.render('╔' + '═'.repeat(borderWidth) + '╗'));
console.log(header.render('║') + ' '.repeat(leftPad) + titleText + ' '.repeat(rightPad) + header.render('║'));
console.log(header.render('╚' + '═'.repeat(borderWidth) + '╝'));
console.log('');

console.log(header.render('System Status'));
console.log('  Server:  ' + success.render('● Running') + muted.render(' (uptime: 42h)'));
console.log('  Database:' + success.render(' ● Connected') + muted.render(' (2.3ms latency)'));
console.log('  Cache:   ' + warning.render('⚠ Slow') + muted.render(' (performance degraded)'));
console.log('');

console.log(header.render('Active Tasks'));
console.log('  [1]  ' + success.render('✓ Data sync') + muted.render(' completed at 10:45'));
console.log('  [2]  ' + warning.render('⟳ Report generation') + muted.render(' in progress'));
console.log('  [3]  ' + error.render('✗ Backup') + muted.render(' failed at 09:30'));
console.log('');

console.log(header.render('Recent Logs'));
const logEntry1 = muted.render('[10:47] ') + success.render('User session started');
const logEntry2 = muted.render('[10:46] ') + warning.render('Memory usage at 78%');
const logEntry3 = muted.render('[10:44] ') + error.render('API request timeout');

console.log('  ' + logEntry1);
console.log('  ' + logEntry2);
console.log('  ' + logEntry3);
console.log('');

// Show an alert
console.log(error.render('❌ Alert:') + ' ' +
  highlight.render('Immediate action required') +
  muted.render(' - backup service is down'));
console.log('');

console.log(muted.render('Last updated: 2026-08-28 10:47:32'));
console.log('');

console.log('✓ Complete example rendered!');
console.log('Notice how semantic colors and attributes combine');
console.log('to create a cohesive, readable terminal UI.');
