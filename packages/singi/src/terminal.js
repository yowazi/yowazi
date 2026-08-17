// @ts-check

/**
 * Terminal utility functions.
 *
 * Low-level terminal control utilities.
 */

/**
 * Get the current terminal dimensions.
 *
 * @returns {{ width: number, heightL number }}
 *
 * @example
 * const { width, height } = getTerminalSize();
 * console.log(`Terminal is ${width} columns and ${height} rows.`);
 */
export function getTerminalSize() {
  return {
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  };
}
