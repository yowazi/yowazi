import { writeSync } from 'node:fs';
import {
  cursorPos,
  cursorDown,
  showCursor,
} from '../src/escapes.js';
import { 
  fg, 
  bg
} from '../src/color.js';
import {
  enterFullscreen,
  exitFullscreen,
} from '../src/terminal.js';

const write = (str) => writeSync(process.stdout.fd, str);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runExample() {
  enterFullscreen({hideCursor:true});
  write(`${fg(255,255,0)}${cursorPos(2, 5)}┌────────────────────────────────┐`);
  write(`${cursorPos(3, 5)}│  Testing Absolute Positioning  │`);
  write(`${cursorPos(4, 5)}└────────────────────────────────┘`);
  write(`${fg(255,0,0)}${cursorPos(16,1)}] [`);
  await sleep(1000);

  write(cursorPos(1,2));
  write(showCursor());
  for (let i=0;i<15;i++) {
    write(cursorDown());
    await sleep(200);
  }

  exitFullscreen();
}

runExample();
