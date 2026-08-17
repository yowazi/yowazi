#!/usr/bin/env bun
// @ts-check

import { getTerminalSize } from '../src/terminal.js';

const { width, height } = getTerminalSize();
console.log( `Terminal has ${width} columns and ${height} rows.` );

