// @ts-check

import { Theme } from '../theme.js';
import darkData from './dark.meta.json' with { type: 'json' };
import lightData from './light.meta.json' with { type: 'json' };
import cyberData from './cyber.meta.json' with { type: 'json' };
import retroData from './retro.meta.json' with { type: 'json' };
import purpleData from './purple.meta.json' with { type: 'json' };
import minimalData from './minimal.meta.json' with { type: 'json' };
import transparentData from './transparent.meta.json' with { type: 'json' };

export const dark = new Theme(darkData);
export const light = new Theme(lightData);
export const cyber = new Theme(cyberData);
export const retro = new Theme(retroData);
export const purple = new Theme(purpleData);
export const minimal = new Theme(minimalData);
export const transparent = new Theme(transparentData);
