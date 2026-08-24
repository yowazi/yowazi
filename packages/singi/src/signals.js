// @ts-check

/**
 * Signal handler registry.
 *
 * Allows multiple modules to register handlers for the same signal.
 * Ensures only one process.on() listener per signal, but calls all
 * registered handlers when the signal fires.
 *
 * @private
 */

/** @type {Map<string, Function[]>} */
const handlers = new Map();

/**
 * Register a handler for a signal.
 * Multiple handlers can be registered for the same signal.
 *
 * @param {string} signal - Signal name (e.g., 'SIGINT', 'SIGTERM')
 * @param {Function} handler - Handler function to call when signal fires
 * @returns {Function} Unregister function (call to remove handler)
 *
 * @example
 * import { registerSignalHandler } from './signals.js';
 *
 * const unregister = registerSignalHandler('SIGINT', () => {
 *   console.log('SIGINT received');
 * });
 *
 * // Later:
 * unregister();
 */
export function registerSignalHandler(signal, handler) {
  // Initialize handler list for this signal if needed
  if (!handlers.has(signal)) {
    handlers.set(signal, []);

    // Register the process signal listener (only once per signal)
    process.on(signal, () => {
      const signalHandlers = handlers.get(signal);
      if (signalHandlers) {
        signalHandlers.forEach(h => {
          try {
            h();
          } catch (err) {
            // Log but don't stop other handlers
            console.error(`[singi] Error in signal handler for ${signal}:`, err);
          }
        });
      }
    });
  }

  // Add handler to the list
  const signalHandlers = handlers.get(signal);
  signalHandlers.push(handler);

  // Return unregister function
  return () => {
    const index = signalHandlers.indexOf(handler);
    if (index >= 0) {
      signalHandlers.splice(index, 1);
    }

    // If no more handlers, unregister from process
    if (signalHandlers.length === 0) {
      process.off(signal, undefined);
      handlers.delete(signal);
    }
  };
}

/**
 * Deregister all handlers for a signal.
 *
 * @param {string} signal - Signal name
 */
export function deregisterSignal(signal) {
  const signalHandlers = handlers.get(signal);
  if (signalHandlers) {
    signalHandlers.length = 0; // Clear array
    process.off(signal, undefined);
    handlers.delete(signal);
  }
}

/**
 * Deregister all handlers for all signals.
 * Used internally for cleanup.
 *
 * @private
 */
export function deregisterAllSignals() {
  handlers.forEach((_, signal) => {
    process.off(signal, undefined);
  });
  handlers.clear();
}
