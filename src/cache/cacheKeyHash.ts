import * as crypto from 'crypto';

/**
 * Hash a cache key using SHA-256 to ensure filesystem safety
 * and prevent issues with special characters
 *
 * @param key The raw cache key string
 * @returns A 64-character hex string (SHA-256 hash)
 */
export function hashCacheKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}
