#!/usr/bin/env bun
// @ts-check

import { getTerminalSize } from '../src/state.js';
import { detectColorProfile, downsampler } from '../src/color.js';

console.log("Terminal Information:");

const { width, height } = getTerminalSize();
console.log( `\tDimensions: ${width} columns x ${height} rows` );

const profile = detectColorProfile();
console.log( `\tColor Profile: ${profile}`);

const convert = downsampler(profile);
const color = convert(200, 180, 30);
console.log(`\tColor (200,180,30) converted: ${color}`);


