import { debug } from './debug';

/**
 * Wraps a function with automatic debug logging for entry, exit, and errors.
 * This is a temporary solution until decorator support is added.
 *
 * NOTE: This utility is preserved for future use but currently unused.
 * Consider using direct debug.namespace() calls for better control.
 *
 * @param fn The function to wrap
 * @param name Optional name override (defaults to function name)
 * @param namespace Debug namespace (defaults to 'tools')
 * @returns The wrapped function with same signature
 *
 * @example
 * export const parseTimeInput = withDebug(
 *   function parseTimeInput(input: string): Date {
 *     return parseISO(input);
 *   }
 * );
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withDebug<T extends (...args: any[]) => any>(
  fn: T,
  name: string = fn.name || 'anonymous',
  namespace:
    | 'utils'
    | 'business'
    | 'cache'
    | 'error'
    | 'timing'
    | 'timezone'
    | 'parse'
    | 'trace' = 'utils'
): T {
  // Get the debug instance for this namespace
  // eslint-disable-next-line security/detect-object-injection
  const debugInstance = debug[namespace];

  // Return wrapped function that preserves original signature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: Parameters<T>): any => {
    // Log function entry with arguments
    debugInstance(`→ ${name} called with:`, args);

    try {
      // Execute original function
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = fn(...args);

      // Handle async functions - DON'T log success until promise resolves
      if (result instanceof Promise) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result
          .then((value) => {
            debugInstance(`✓ ${name} succeeded`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return value;
          })
          .catch((error) => {
            debugInstance(`✗ ${name} failed:`, error);
            throw error;
          });
      }

      // Log success for sync functions only
      debugInstance(`✓ ${name} succeeded`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result;
    } catch (error) {
      // This catches sync errors and async function creation errors
      // For async functions that throw immediately, the error becomes a rejected promise
      if (error instanceof Promise) {
        // This shouldn't happen, but handle it just in case
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return error;
      }
      // Log sync error and rethrow
      debugInstance(`✗ ${name} failed:`, error);
      throw error;
    }
  }) as T;
}

/**
 * Convenience wrapper for utility functions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withDebugUtils<T extends (...args: any[]) => any>(
  fn: T,
  name: string = fn.name
): T {
  return withDebug(fn, name, 'utils');
}

/**
 * Convenience wrapper for cache functions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withDebugCache<T extends (...args: any[]) => any>(
  fn: T,
  name: string = fn.name
): T {
  return withDebug(fn, name, 'cache');
}
