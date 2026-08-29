// @ts-check

import { Style } from '@yowazi/rangi';

/**
 * @typedef {import('./cell-parser').Cell} Cell
 */

/**
 * Convert a cell run (sequence of cells with same style) to a styled string.
 * Constructs a Style object matching the run's attrs/colors and renders the text.
 *
 * @private
 * @param {Cell[]} run - Cells with identical {attrs, fg, bg}
 * @returns {string} - ANSI-decorated string
 */
function renderCellRun(run) {
  if (run.length === 0) return '';

  const cellData = run[0];
  let style = new Style();

  // Apply attributes
  for (const attr of cellData.attrs) {
    if (attr === 'bold') style = style.bold();
    else if (attr === 'dim') style = style.dim();
    else if (attr === 'italic') style = style.italic();
    else if (attr === 'underline') style = style.underline();
    else if (attr === 'blink') style = style.blink();
    else if (attr === 'invert') style = style.invert();
    else if (attr === 'strike') style = style.strike();
  }

  // Apply foreground
  if (cellData.fg) {
    if (cellData.fg.type === 'semantic') {
      style = style.foreground(cellData.fg.role);
    } else if (cellData.fg.type === 'rgb') {
      const [r, g, b] = cellData.fg.value;
      style = style.foregroundRGB(r, g, b);
    }
  }

  // Apply background
  if (cellData.bg) {
    if (cellData.bg.type === 'semantic') {
      style = style.background(cellData.bg.role);
    } else if (cellData.bg.type === 'rgb') {
      const [r, g, b] = cellData.bg.value;
      style = style.backgroundRGB(r, g, b);
    }
  }

  // Build text from run characters (skip width-0 continuation cells)
  const text = run.filter(c => c.width !== 0).map(c => c.char).join('');

  return style.render(text);
}

/**
 * Convert a 2D cell grid to ANSI-decorated strings.
 *
 * @param {Cell[][] | null} rows - 2D array of cells (null = treat as empty)
 * @returns {string[]} - Array of ANSI strings, one per row
 */
export function cellsToANSI(rows) {
  if (!rows) return [];

  const result = [];

  for (const row of rows) {
    if (row.length === 0) {
      result.push('');
      continue;
    }

    // Group consecutive cells with identical style into runs
    const runs = [];
    let currentRun = null;

    for (let i = 0; i < row.length; i++) {
      const cell = row[i];

      // Handle null cells (transparency — render as space)
      if (cell === null) {
        if (currentRun) {
          runs.push(currentRun);
          currentRun = null;
        }
        // Add a null cell as a placeholder for a space
        runs.push([null]);
        continue;
      }

      // Start first run or check if style matches previous
      if (!currentRun) {
        currentRun = [cell];
        continue;
      }

      const prevCell = currentRun[0];

      // Check if style matches previous
      const sameStyle =
        cell.width === prevCell.width && // Can't group continuation cells with regular cells
        cell.attrs.size === prevCell.attrs.size &&
        [...cell.attrs].every(a => prevCell.attrs.has(a)) &&
        colorsEqual(cell.fg, prevCell.fg) &&
        colorsEqual(cell.bg, prevCell.bg);

      if (sameStyle && cell.width !== 0) {
        // Continue current run (skip width-0 continuation cells as separate)
        currentRun.push(cell);
      } else if (cell.width === 0) {
        // Continuation cell — append to current run even if style differs
        // (its character is already accounted for in the previous cell)
        currentRun.push(cell);
      } else {
        // Style changed — start new run
        runs.push(currentRun);
        currentRun = [cell];
      }
    }

    // Don't forget the last run
    if (currentRun) {
      runs.push(currentRun);
    }

    // Render each run and concatenate
    const rowString = runs.map(run => {
      if (run[0] === null) return ' '; // Null cell renders as space
      return renderCellRun(run);
    }).join('');
    result.push(rowString);
  }

  return result;
}

/**
 * Check if two ColorSpec objects are equal.
 * @private
 * @param {import('@yowazi/rangi').ColorSpec | null} a
 * @param {import('@yowazi/rangi').ColorSpec | null} b
 * @returns {boolean}
 */
function colorsEqual(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a.type !== b.type) return false;
  if (a.type === 'semantic') {
    return a.role === b.role;
  }
  if (a.type === 'rgb') {
    return (
      a.value[0] === b.value[0] &&
      a.value[1] === b.value[1] &&
      a.value[2] === b.value[2]
    );
  }
  return false;
}
