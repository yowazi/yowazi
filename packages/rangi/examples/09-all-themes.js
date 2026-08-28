#!/usr/bin/env node
// @ts-check

/**
 * Example 9: All Built-in Themes
 *
 * Showcases all 7 built-in themes side-by-side.
 * Shows how each theme interprets semantic color roles.
 */

import { Style, setTheme } from '@yowazi/rangi';
import { dark, light, cyber, retro, purple, minimal, transparent } from '@yowazi/rangi/themes';

console.log('=== Example 9: All Built-in Themes ===\n');

const allThemes = [
  { name: 'dark', theme: dark, description: 'Default, dark terminal optimized' },
  { name: 'light', theme: light, description: 'Light terminal, high contrast' },
  { name: 'cyber', theme: cyber, description: 'Technical, modern (cyan/blue)' },
  { name: 'retro', theme: retro, description: 'Vintage, warm (orange/gold)' },
  { name: 'purple', theme: purple, description: 'Creative, playful (magenta)' },
  { name: 'minimal', theme: minimal, description: 'Clean, understated (grays)' },
  { name: 'transparent', theme: transparent, description: 'Overlay-friendly, no background' },
];

// Define reusable semantic styles
const createSemanticStyles = () => ({
  header: new Style().bold().foreground('primary'),
  success: new Style().foreground('primary'),
  warning: new Style().foreground('warning'),
  error: new Style().foreground('error'),
  secondary: new Style().dim().foreground('secondary'),
});

console.log('Semantic color roles across all themes:\n');

for (const { name, theme, description } of allThemes) {
  setTheme(theme);
  const styles = createSemanticStyles();

  console.log(styles.header.render(`▸ ${name.toUpperCase()}`));
  console.log(styles.secondary.render(`  ${description}`));
  console.log('');

  // Show each semantic role with fg + bg applied to sample text
  const roles = [
    { label: 'Default:', role: 'default' },
    { label: 'Primary:', role: 'primary' },
    { label: 'Secondary:', role: 'secondary' },
    { label: 'Alert:', role: 'alert' },
    { label: 'Warning:', role: 'warning' },
    { label: 'Error:', role: 'error' },
  ];

  for (const { label, role } of roles) {
    const fgBg = new Style()
      .foreground(role)
      .background(role);
    const sampleText = fgBg.render(' Sample text ');
    console.log(`  ${label.padEnd(12)} ${sampleText}`);
  }

  console.log('');
}

console.log('Tips for choosing a theme:');
console.log('  • dark:       Best for dark terminals (default)');
console.log('  • light:      Use with light terminal backgrounds');
console.log('  • cyber:      Modern, technical look (strong cyan)');
console.log('  • retro:      Vintage aesthetic (warm oranges/golds)');
console.log('  • purple:     Creative, playful (bright magentas)');
console.log('  • minimal:    Understated, professional (grays)');
console.log('  • transparent: Overlay UI, inherits parent colors');

console.log('\n✓ All themes demonstrated!');
