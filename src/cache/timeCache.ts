import NodeCache from 'node-cache';

// Cache TTL by operation type (in seconds)
export const CacheTTL = {
  CURRENT_TIME: 1, // 1 second
  TIMEZONE_CONVERT: 300, // 5 minutes
  CALCULATIONS: 3600, // 1 hour
  BUSINESS_DAYS: 86400, // 24 hours
};

// Create cache instance with default settings
export const cache = new NodeCache({
  stdTTL: 60, // Default 60 seconds
  checkperiod: 120, // Check for expired keys every 2 minutes
  maxKeys: 10000, // Limit memory usage
});
