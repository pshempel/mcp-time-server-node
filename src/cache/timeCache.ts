import { MemoryAwareCache } from './memoryAwareCache';
import type { MemoryStats } from './memoryAwareCache';
import { hashCacheKey } from './cacheKeyHash';

// Cache TTL by operation type (in seconds)
export const CacheTTL = {
  CURRENT_TIME: 1, // 1 second
  TIMEZONE_CONVERT: 300, // 5 minutes
  CALCULATIONS: 3600, // 1 hour
  BUSINESS_DAYS: 86400, // 24 hours
};

// Create cache instance with 10MB memory limit
export const cache = new MemoryAwareCache({
  maxMemory: 10 * 1024 * 1024, // 10MB limit
  stdTTL: 60, // Default 60 seconds
  checkperiod: 120, // Check for expired keys every 2 minutes
  evictOnFull: true, // Enable eviction when memory limit reached
});

// Export memory stats for monitoring
export function getCacheMemoryStats(): MemoryStats {
  return cache.getMemoryStats();
}

// Re-export the hash function for use in tools
export { hashCacheKey };
