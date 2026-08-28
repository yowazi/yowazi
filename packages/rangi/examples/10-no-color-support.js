#!/usr/bin/env node
// @ts-check

/**
 * Example 10: NO_COLOR Standard Support
 *
 * Demonstrates respecting the NO_COLOR environment variable.
 * https://no-color.org/
 *
 * The NO_COLOR environment variable is a standard convention that signals
 * the user's preference for no color output. Many CLI tools respect this
 * to support accessibility needs, piping to files, and user preferences.
 *
 * Usage:
 *   node 10-no-color-support.js          (with colors)
 *   NO_COLOR=1 node 10-no-color-support.js (without colors)
 */

import { Style, setTheme } from '@yowazi/rangi';
import { dark } from '@yowazi/rangi/themes';

console.log('=== Example 10: NO_COLOR Standard Support ===\n');

// Check for NO_COLOR environment variable
const hasNoColorPreference = process.env.NO_COLOR !== undefined;

if (hasNoColorPreference) {
  console.log('NO_COLOR is set: Using text attributes only, no colors\n');
} else {
  console.log('NO_COLOR not set: Using full theme colors\n');
  setTheme(dark);
}

// Define styles that work with or without colors
const createStyles = () => {
  // Base styles with semantic roles (ignored if NO_COLOR is set)
  const header = new Style().bold().foreground('primary');
  const success = new Style().foreground('primary');
  const warning = new Style().foreground('warning');
  const error = new Style().foreground('error');

  // Attribute-only alternatives (always work)
  const headerPlain = new Style().bold();
  const successPlain = new Style().bold();
  const warningPlain = new Style().underline();
  const errorPlain = new Style().bold().underline();

  // Return appropriate styles based on NO_COLOR
  return {
    header: hasNoColorPreference ? headerPlain : header,
    success: hasNoColorPreference ? successPlain : success,
    warning: hasNoColorPreference ? warningPlain : warning,
    error: hasNoColorPreference ? errorPlain : error,
  };
};

const styles = createStyles();

// Example output
console.log(styles.header.render('Application Status Report'));
console.log('');

console.log('Checks:');
console.log('  ' + styles.success.render('✓ Database connection') + ' established');
console.log('  ' + styles.warning.render('⚠ Cache') + ' performance degraded');
console.log('  ' + styles.error.render('✗ API') + ' request failed');
console.log('');

console.log('Log Messages:');
console.log('  [2024-01-15] ' + styles.success.render('INFO') + ' - Server started');
console.log('  [2024-01-15] ' + styles.warning.render('WARN') + ' - High memory usage');
console.log('  [2024-01-15] ' + styles.error.render('ERROR') + ' - Connection timeout');
console.log('');

// Show how to detect NO_COLOR
console.log('How to detect NO_COLOR:');
console.log('  if (process.env.NO_COLOR !== undefined) {');
console.log('    // User prefers no colors');
console.log('  }');
console.log('');

console.log('Try running with NO_COLOR set:');
console.log('  NO_COLOR=1 bun examples/10-no-color-support.js');
console.log('');

console.log('✓ NO_COLOR pattern demonstrated!');
console.log('This respects user accessibility preferences and piping to files.');
