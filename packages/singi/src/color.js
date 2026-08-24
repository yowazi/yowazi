// @ts-check

/**
 * @typedef {('NoColor'|'Ansi16'|'Ansi256'|'TrueColor')} ColorProfile
 */

// Cache profile to avoid re-reading process.env on every call.
let cachedProfile = null;

import { CSI } from './escapes.js';

export const ColorProfile = Object.freeze({
  NoColor: 'NoColor',
  Ansi16: 'Ansi16',
  Ansi256: 'Ansi256',
  TrueColor: 'TrueColor',
});

/**
 * Detech terminal color capability from process state.
 * @param {bool} forceDetect
 * @returns {ColorProfile}
 */
export function detectColorProfile(forceDetect=false) {
  if (cachedProfile && !forceDetect) return cachedProfile;

  const env = process.env;

  if (env.NO_COLOR != undefined) {
    return (cachedProfile = 'NoColor');
  }

  if (env.FORCE_COLOR != undefined) {
    const force = env.FORCE_COLOR;
    if (force === '0' || force === 'false' ) return (cachedProfile = ColorProfile.NoColor);
    if (force === '1') return (cachedProfile = ColorProfile.Ansi16);
    if (force === '2') return (cachedProfile = ColorProfile.Ansi256);
    if (force === '3') return (cachedProfile = ColorProfile.TrueColor);
    return (cachedProfile = ColorProfile.Ansi256);
  }

  if (!process.stdout?.isTTY) {
    return (cachedProfile = ColorProfile.NoColor);
  }

  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit' ) {
    // Deal with Linux lying about truecolor support.
    return ( cachedProfile = env.TERM === 'linux' ? ColorProfile.Ansi256 : ColorProfile.TrueColor);
  }

  if (env.TERM?.endsWith('-256color')) {
    return (cachedProfile = ColorProfile.Ansi256);
  }

  if(env.TERM_PROGRAM === 'Apple_Terminal') {
    return (cachedProfile = ColorProfile.Ansi256);
  }

  return (cachedProfile = ColorProfile.Ansi16);
}

/**
 * Downsampling factory to use for a given profile.
 * @param {ColorProfile} profile
 * @returns {(r: number, g: number, b: number) => string}
 */
export function downsampler(profile) {
  switch (profile) {
    case ColorProfile.Ansi16:
      return downsampleTo16;
    case ColorProfile.Ansi256:
      return downsampleTo256;
    case ColorProfile.TrueColor:
      return (r, g, b) => {
        return `${r};${g};${b}`;
      }
    default:
      return (_r, _g, _b) => '';
  }
}

/**
 * Downsample an RGB color to standard 16-color ANSI code string (30-37, 90-97).
 * @param {number} r 0-255
 * @param {number} g 0-255
 * @param {number} b 0-255
 * @returns {string} ANSI escape number coded string.
 */
function downsampleTo16(r, g, b) {
  const brightness = r + g + b > 382 ? 60 : 0;
  let color = 0;
  if (r > 127) color |= 1;
  if (g > 127) color |= 2;
  if (b > 127) color |= 4;
  return String(30 + color + brightness);
}

/**
 * Downsample an RGB color to the 256-color pallette index string.
 * Use Direct Range Thresholds for 6x6x6 cube and fast grayscale logic.
 * No need for loops as 6x6x6 cube is simple enough to determine.
 * @param {number} r 0-255
 * @param {number} g 0-255
 * @param {number} b 0-255
 * @returns {string} 256-color pallette index as a string.
 */
function downsampleTo256(r, g, b) {
  
  // Get the highest value...
  const max = r > g ? ( r > b ? r : b ) : (g > b ? g : b);
  // Get the lowest value...
  const min = r < g ? ( r < b ? r : b ) : ( g < b ? g : b);

  // Quick grayscale logic.
  if (max - min < 10) {
    const gray = (r + g + b) / 3; 
    if (gray < 4) return '16'; // xterm pure black
    if (gray > 248 ) return '231'; // xterm pure white

    // Clamp to xterm's 24-step grayscale ramp.
    return String(Math.round((gray - 8) / 10) + 232);
  }

  // Map to 6x6x6 cube color indices.
  const rIdx = r < 48 ? 0 : r < 115 ? 1 : r < 155 ? 2 : r < 195 ? 3 : r < 235 ? 4 : 5;
  const gIdx = g < 48 ? 0 : g < 115 ? 1 : g < 155 ? 2 : g < 195 ? 3 : g < 235 ? 4 : 5;
  const bIdx = b < 48 ? 0 : b < 115 ? 1 : b < 155 ? 2 : b < 195 ? 3 : b < 235 ? 4 : 5;

  // Index = Base Offset (16) + (Red * 36) + (Green * 6) + Blue.
  return String(16 + rIdx * 36 + gIdx * 6 + bIdx);
}

/**
 * Returns a foreground color string.
 *
 * @param {number} r 0-255
 * @param {number} g 0-255
 * @param {number} b 0-255
 *
 * @returns {string}
 */
export function fg(r, g, b) {
  const profile = detectColorProfile();
  const sampler = downsampler(profile);
  const colorCode = sampler(r, g, b);

  if (profile === ColorProfile.NoColor || !colorCode) return '';
  if (profile === ColorProfile.Ansi16) return `${CSI}${colorCode}m`;
  if (profile === ColorProfile.Ansi256) return `${CSI}38;5;${colorCode}m`;
  if (profile === ColorProfile.TrueColor) return `${CSI}38;2;${colorCode}m`;
}

/**
 * Returns a background color string.
 *
 * @param {number} r 0-255
 * @param {number} g 0-255
 * @param {number} b 0-255
 *
 * @returns {string}
 */
export function bg(r, g, b) {
  const profile = detectColorProfile();
  const sampler = downsampler(profile);
  const colorCode = sampler(r, g, b);

  if (profile === ColorProfile.NoColor || !colorCode) return '';
  if (profile === ColorProfile.Ansi16) return `${CSI}${parseInt(colorCode) + 10}m`;
  if (profile === ColorProfile.Ansi256) return `${CSI}48;5;${colorCode}m`;
  if (profile === ColorProfile.TrueColor) return `${CSI}48;2;${colorCode}m`;
}

