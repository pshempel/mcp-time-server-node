import { hashCacheKey } from '../cache/cacheKeyHash';
import { cache } from '../cache/timeCache';

import { debug } from './debug';

/**
 * Generic cache wrapper that encapsulates the common caching pattern
 * used across all tools. Reduces ~12 lines of boilerplate to 3 lines.
 *
 * @param cacheKey - Raw cache key (will be hashed)
 * @param ttl - Time to live in seconds
 * @param compute - Function that computes the value if not cached
 * @returns The cached or computed value
 *
 * @example
 * ```typescript
 * return withCache(
 *   `add_${time}_${amount}_${unit}_${timezone}`,
 *   CacheTTL.CALCULATIONS,
 *   () => {
 *     // Expensive computation here
 *     return computedResult;
 *   }
 * );
 * ```
 */
export function withCache<T>(cacheKey: string, ttl: number, compute: () => T): T {
  // Hash the cache key for consistent storage
  const hashedKey = hashCacheKey(cacheKey);

  // Log cache key mapping for debugging (only first 20 chars of key for security)
  if (debug.cache.enabled && cacheKey.length > 20) {
    debug.cache('Cache key: %s... → %s', cacheKey.substring(0, 20), hashedKey.substring(0, 12));
  }

  // Try to get from cache
  // Using !== undefined to handle falsy values (0, false, null, '') correctly
  // Wrap in try-catch to handle cache read errors gracefully
  let cached: T | undefined;
  try {
    cached = cache.get<T>(hashedKey);
  } catch (error) {
    // If cache read fails, continue to compute
    debug.error('Cache read error: %O', error);
    cached = undefined;
  }

  if (cached !== undefined) {
    debug.cache('Cache HIT for %s (TTL: %ds)', hashedKey.substring(0, 12), ttl);
    return cached;
  }

  debug.cache('Cache MISS for %s - computing...', hashedKey.substring(0, 12));

  // Not in cache, compute the value
  const result = compute();

  // Store in cache for future use (ignore cache write errors)
  try {
    cache.set(hashedKey, result, ttl);
    debug.cache('Cache SET for %s (TTL: %ds)', hashedKey.substring(0, 12), ttl);
  } catch (error) {
    // Cache write failure is non-fatal, return computed result
    debug.error('Cache write error: %O', error);
  }

  return result;
}

/**
 * Async version of withCache for future use if needed
 * Currently not used as all tools are synchronous
 */
export async function withCacheAsync<T>(
  cacheKey: string,
  ttl: number,
  compute: () => Promise<T>
): Promise<T> {
  const hashedKey = hashCacheKey(cacheKey);

  const cached = cache.get<T>(hashedKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = await compute();

  try {
    cache.set(hashedKey, result, ttl);
  } catch {
    // Cache write failure is non-fatal, return computed result
  }

  return result;
}
