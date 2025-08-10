/**
 * Cache Key Builder Utility
 *
 * Provides a consistent, type-safe way to build cache keys across all tools.
 * Reduces duplication and prevents cache key collisions.
 *
 * Features:
 * - Consistent ordering (alphabetical) for same inputs
 * - Special character escaping to prevent parsing issues
 * - Type-safe options with clear categories
 * - Optimized for readability in debug output
 */

import { debug } from './debug';

export interface CacheKeyOptions {
  /** Single string/number values */
  single?: Record<string, string | number | undefined | null>;
  /** Date values that should be joined with | separator */
  dates?: string[];
  /** Boolean flags */
  flags?: Record<string, boolean | undefined>;
  /** Array values that should be joined with commas */
  arrays?: Record<string, string[]>;
  /** Optional values that might be undefined/null */
  optional?: Record<string, string | undefined | null>;
}

/**
 * Escapes special characters in cache key values to prevent parsing issues
 */
function escapeValue(value: string): string {
  // Escape colons and other special chars that might interfere with key structure
  const escaped = encodeURIComponent(value)
    .replace(/%2F/g, '%2F') // Keep forward slashes encoded for timezone paths
    .replace(/%3A/g, '%3A'); // Keep colons encoded

  // Only log if something was actually escaped
  if (escaped !== value) {
    debug.utils('Cache key value escaped:', {
      original: value,
      escaped,
    });
  }

  return escaped;
}

/**
 * Converts a value to a cache-safe string
 */
function valueToString(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'object' && value !== null) {
    try {
      return escapeValue(JSON.stringify(value));
    } catch {
      return escapeValue('[Circular object]');
    }
  }
  // Only primitives left (string, undefined, null, symbol, bigint)
  // TypeScript doesn't know we've already handled all objects, so we assert
  return escapeValue(String(value as string | undefined | null | symbol | bigint));
}

/**
 * Builds a consistent, collision-free cache key from structured options
 *
 * @param prefix - The base prefix for the cache key (e.g., 'business_days', 'convert')
 * @param options - Structured options to include in the key
 * @returns A consistent cache key string
 *
 * @example
 * ```typescript
 * // Simple usage
 * buildCacheKey('convert', {
 *   single: { time: '2025-01-01', from: 'UTC', to: 'EST' }
 * });
 * // Returns: 'convert:from=UTC:time=2025-01-01:to=EST'
 *
 * // Complex usage with all option types
 * buildCacheKey('business_days', {
 *   dates: ['2025-01-01', '2025-01-31'],
 *   flags: { excludeWeekends: true },
 *   arrays: { holidays: ['2025-01-01'] },
 *   optional: { timezone: 'America/New_York' }
 * });
 * ```
 */
export function buildCacheKey(prefix: string, options?: CacheKeyOptions): string {
  if (!options) {
    debug.utils('Building simple cache key:', { prefix });
    return prefix;
  }

  // Log complex key building
  debug.utils('Building cache key:', {
    prefix,
    hasOptions: {
      single: !!options.single,
      dates: !!options.dates,
      flags: !!options.flags,
      arrays: !!options.arrays,
      optional: !!options.optional,
    },
  });

  const parts: string[] = [];

  // Collect all key-value pairs
  const allPairs: Array<[string, string]> = [];

  // Process single values
  if (options.single) {
    for (const [key, value] of Object.entries(options.single)) {
      allPairs.push([key, valueToString(value)]);
    }
  }

  // Process dates (special handling with | separator)
  if (options.dates && options.dates.length > 0) {
    allPairs.push(['dates', options.dates.join('|')]);
  }

  // Process flags
  if (options.flags) {
    for (const [key, value] of Object.entries(options.flags)) {
      // Treat undefined as false for flags
      allPairs.push([key, value ? 'true' : 'false']);
    }
  }

  // Process arrays
  if (options.arrays) {
    for (const [key, values] of Object.entries(options.arrays)) {
      // Warn about large arrays that might create very long keys
      if (values.length > 10) {
        debug.decision('Large array in cache key', {
          key,
          count: values.length,
          sample: values.slice(0, 3),
        });
      }
      allPairs.push([key, values.join(',')]);
    }
  }

  // Process optional values
  if (options.optional) {
    for (const [key, value] of Object.entries(options.optional)) {
      allPairs.push([key, valueToString(value)]);
    }
  }

  // Sort pairs alphabetically by key for consistency
  allPairs.sort((a, b) => a[0].localeCompare(b[0]));

  // Build the final key
  for (const [key, value] of allPairs) {
    parts.push(`${key}=${value}`);
  }

  // Combine prefix with parts
  let finalKey: string;
  if (prefix && parts.length > 0) {
    finalKey = `${prefix}:${parts.join(':')}`;
  } else if (prefix) {
    finalKey = prefix;
  } else {
    finalKey = parts.join(':');
  }

  // Log final key (truncate if very long)
  if (finalKey.length > 100) {
    debug.utils('Cache key built (truncated):', {
      length: finalKey.length,
      preview: finalKey.substring(0, 100) + '...',
    });
  } else {
    debug.utils('Cache key built:', finalKey);
  }

  return finalKey;
}

/**
 * Builds a cache key from raw values (backward compatibility helper)
 * Useful for gradual migration from string concatenation
 *
 * @deprecated Use buildCacheKey with structured options instead
 */
export function buildCacheKeyLegacy(
  ...values: Array<string | number | boolean | undefined | null>
): string {
  return values
    .map((v) => valueToString(v))
    .filter((v) => v !== '')
    .join('_');
}
