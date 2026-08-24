// @ts-check
import { describe, it, expect } from 'bun:test';
import {
  CSI,
  OSC,
  cursorPos,
  cursorUp,
  cursorDown,
  cursorLeft,
  cursorRight,
  hideCursor,
  showCursor,
  saveCursor,
  restoreCursor,
  eraseToEndOfLine,
  eraseLine,
  eraseToEndOfScreen,
  clearScreen,
  altScreenEnable,
  altScreenDisable,
  sgr,
  sgrReset,
  bold,
  noBold,
  dim,
  noDim,
  italic,
  noItalic,
  underline,
  noUnderline,
  blink,
  noBlink,
  invert,
  noInvert,
  strike,
  noStrike,
  stripAnsi,
} from './escapes.js';

describe('escape sequence constants', () => {
  it('defines CSI prefix', () => {
    expect(CSI).toBe('\x1b[');
  });

  it('defines OSC prefix', () => {
    expect(OSC).toBe('\x1b]');
  });
});

describe('cursor controls', () => {
  it('cursorPos generates absolute positioning', () => {
    expect(cursorPos(5, 10)).toBe(`${CSI}5;10H`);
    expect(cursorPos(1, 1)).toBe(`${CSI}1;1H`);
    expect(cursorPos(24, 80)).toBe(`${CSI}24;80H`);
  });

  it('cursorUp moves up by n lines', () => {
    expect(cursorUp()).toBe(`${CSI}1A`);
    expect(cursorUp(5)).toBe(`${CSI}5A`);
    expect(cursorUp(0)).toBe(`${CSI}0A`);
  });

  it('cursorDown moves down by n lines', () => {
    expect(cursorDown()).toBe(`${CSI}1B`);
    expect(cursorDown(5)).toBe(`${CSI}5B`);
    expect(cursorDown(10)).toBe(`${CSI}10B`);
  });

  it('cursorRight moves right by n columns', () => {
    expect(cursorRight()).toBe(`${CSI}1C`);
    expect(cursorRight(3)).toBe(`${CSI}3C`);
    expect(cursorRight(20)).toBe(`${CSI}20C`);
  });

  it('cursorLeft moves left by n columns', () => {
    expect(cursorLeft()).toBe(`${CSI}1D`);
    expect(cursorLeft(3)).toBe(`${CSI}3D`);
    expect(cursorLeft(15)).toBe(`${CSI}15D`);
  });

  it('hideCursor generates hide sequence', () => {
    expect(hideCursor()).toBe(`${CSI}?25l`);
  });

  it('showCursor generates show sequence', () => {
    expect(showCursor()).toBe(`${CSI}?25h`);
  });

  it('saveCursor generates save sequence', () => {
    expect(saveCursor()).toBe(`${CSI}s`);
  });

  it('restoreCursor generates restore sequence', () => {
    expect(restoreCursor()).toBe(`${CSI}u`);
  });
});

describe('screen controls', () => {
  it('eraseToEndOfLine generates correct sequence', () => {
    expect(eraseToEndOfLine()).toBe(`${CSI}K`);
  });

  it('eraseLine generates correct sequence', () => {
    expect(eraseLine()).toBe(`${CSI}2K`);
  });

  it('eraseToEndOfScreen generates correct sequence', () => {
    expect(eraseToEndOfScreen()).toBe(`${CSI}J`);
  });

  it('clearScreen generates correct sequence', () => {
    expect(clearScreen()).toBe(`${CSI}2J`);
  });

  it('altScreenEnable generates correct sequence', () => {
    expect(altScreenEnable()).toBe(`${CSI}?1049h`);
  });

  it('altScreenDisable generates correct sequence', () => {
    expect(altScreenDisable()).toBe(`${CSI}?1049l`);
  });
});

describe('SGR (text attributes)', () => {
  it('sgr generates raw SGR sequences', () => {
    expect(sgr(1)).toBe(`${CSI}1m`);
    expect(sgr(1, 31)).toBe(`${CSI}1;31m`);
    expect(sgr(1, 31, 40)).toBe(`${CSI}1;31;40m`);
  });

  it('sgrReset generates reset sequence', () => {
    expect(sgrReset()).toBe(`${CSI}0m`);
  });

  it('bold generates bold sequence', () => {
    expect(bold()).toBe(`${CSI}1m`);
  });

  it('noBold generates no-bold sequence', () => {
    expect(noBold()).toBe(`${CSI}22m`);
  });

  it('dim generates dim sequence', () => {
    expect(dim()).toBe(`${CSI}2m`);
  });

  it('noDim generates no-dim sequence', () => {
    expect(noDim()).toBe(`${CSI}22m`);
  });

  it('italic generates italic sequence', () => {
    expect(italic()).toBe(`${CSI}3m`);
  });

  it('noItalic generates no-italic sequence', () => {
    expect(noItalic()).toBe(`${CSI}23m`);
  });

  it('underline generates underline sequence', () => {
    expect(underline()).toBe(`${CSI}4m`);
  });

  it('noUnderline generates no-underline sequence', () => {
    expect(noUnderline()).toBe(`${CSI}24m`);
  });

  it('blink generates blink sequence', () => {
    expect(blink()).toBe(`${CSI}5m`);
  });

  it('noBlink generates no-blink sequence', () => {
    expect(noBlink()).toBe(`${CSI}25m`);
  });

  it('invert generates invert sequence', () => {
    expect(invert()).toBe(`${CSI}7m`);
  });

  it('noInvert generates no-invert sequence', () => {
    expect(noInvert()).toBe(`${CSI}27m`);
  });

  it('strike generates strikethrough sequence', () => {
    expect(strike()).toBe(`${CSI}9m`);
  });

  it('noStrike generates no-strikethrough sequence', () => {
    expect(noStrike()).toBe(`${CSI}29m`);
  });
});

describe('utilities', () => {
  it('stripAnsi removes ANSI sequences', () => {
    expect(stripAnsi(`${CSI}1mBold${CSI}0m`)).toBe('Bold');
    expect(stripAnsi(`${CSI}31mRed text${CSI}0m`)).toBe('Red text');
  });

  it('stripAnsi handles text without sequences', () => {
    expect(stripAnsi('plain text')).toBe('plain text');
  });

  it('stripAnsi handles multiple sequences', () => {
    const text = `${CSI}1m${CSI}31mBold Red${CSI}0m Normal`;
    expect(stripAnsi(text)).toBe('Bold Red Normal');
  });

  it('stripAnsi handles cursor positioning', () => {
    const text = `${CSI}5;10HHello`;
    expect(stripAnsi(text)).toBe('Hello');
  });

  it('stripAnsi handles empty string', () => {
    expect(stripAnsi('')).toBe('');
  });
});
