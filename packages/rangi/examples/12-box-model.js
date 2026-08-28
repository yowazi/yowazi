#!/usr/bin/env bun

/**
 * Example 12: Box Model
 *
 * Demonstrates the box model features: padding, borders, sizing, and alignment.
 */

import { Style, dark } from '@yowazi/rangi';
import { getTerminalSize, stringWidth } from '@yowazi/singi';

// Force TrueColor for this example
process.env.FORCE_COLOR = '3';

console.log('\n=== Box Model Features ===\n');

// 1. Padding examples
console.log('1. Padding (all sides, vertical/horizontal, explicit):');
console.log(new Style().border('normal').padding(1).render('Padded'));
console.log();

console.log(new Style().border('normal').padding(1, 2).render('V=1, H=2'));
console.log();

console.log(
  new Style()
    .border('normal')
    .padding(1, 2, 1, 3)
    .render('T=1, R=2, B=1, L=3')
);
console.log();

// 2. Border styles
console.log('2. Different border styles:');
console.log(new Style().border('normal').render('Normal'));
console.log();

console.log(new Style().border('rounded').render('Rounded'));
console.log();

console.log(new Style().border('thick').render('Thick'));
console.log();

console.log(new Style().border('double').render('Double'));
console.log();

// 3. Partial borders (borderSides)
console.log('3. Partial borders (borderSides):');
console.log(new Style().border('normal').borderSides({ bottom: false }).render('No bottom'));
console.log();

console.log(
  new Style()
    .border('rounded')
    .borderSides({ left: false, right: false })
    .render('Top & bottom only')
);
console.log();

// 4. Border colors
console.log('4. Border colors:');
console.log(
  new Style()
    .border('normal')
    .borderForeground('primary')
    .padding(1)
    .render('Primary border')
);
console.log();

console.log(
  new Style()
    .border('normal')
    .borderForegroundRGB(255, 100, 100)
    .padding(1)
    .render('Custom red border')
);
console.log();

// 5. Sizing examples
console.log('5. Fixed width and alignment:');
const title = 'Title';
console.log(new Style().width(20).align('left').border('normal').render(title));
console.log();

console.log(new Style().width(20).align('center').border('normal').render(title));
console.log();

console.log(new Style().width(20).align('right').border('normal').render(title));
console.log();

// 6. Width with padding
console.log('6. Width with padding and border:');
console.log(
  new Style()
    .width(25)
    .align('center')
    .padding(1, 2)
    .border('rounded')
    .foreground('secondary')
    .render('Padded & bordered')
);
console.log();

// 7. Multi-line content with sizing
console.log('7. Multi-line content with sizing:');
const multiLine = 'Line one\nLine two\nLine three';
console.log(
  new Style()
    .width(15)
    .height(4)
    .align('center')
    .border('normal')
    .render(multiLine)
);
console.log();

// 8. Semantic color styling on box
console.log('8. Semantic colors with box model:');
console.log(
  new Style()
    .foreground('primary')
    .background('primary')
    .border('double')
    .padding(1)
    .render('Styled box')
);
console.log();

console.log(
  new Style()
    .foreground('error')
    .background('error')
    .border('thick')
    .padding(1)
    .render('Error box')
);
console.log();

// 9. Complex combination
console.log('9. Complex box styling:');
console.log(
  new Style()
    .bold()
    .foreground('default')
    .background('secondary')
    .border('rounded')
    .borderForeground('secondary')
    .padding(2, 4)
    .width(35)
    .align('center')
    .render('Complex styled box')
);
console.log();

console.log('=== Box Model Complete ===\n');
