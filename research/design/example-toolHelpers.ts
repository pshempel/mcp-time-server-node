/**
 * Shared helper functions for tools to reduce code duplication
 * and ensure consistency across the codebase
 */

import { cache } from '../cache/timeCache';
import { TimeServerErrorCodes } from '../types';
import { createError } from './validation';
import { debug } from './debug';

/**
 * Get a cached result if available
 * @param cacheKey - The hashed cache key
 * @returns The cached result or undefined if not found
 */
export function getCachedResult<T>(cacheKey: string): T | undefined {
  const cached = cache.get<T>(cacheKey);
  if (cached) {
    debug.cache('Cache hit for key: %s', cacheKey);
  }
  return cached;
}

/**
 * Cache a result with the specified TTL
 * @param cacheKey - The hashed cache key
 * @param result - The result to cache
 * @param ttl - The cache TTL to use
 */
export function cacheResult<T>(
  cacheKey: string,
  result: T,
  ttl: number,
): void {
  cache.set(cacheKey, result, ttl);
  debug.cache('Result cached with TTL %d for key: %s', ttl, cacheKey);
}

/**
 * Format a converted time with optional custom format
 * @param date - The date to format
 * @param timezone - The timezone to format in
 * @param customFormat - Optional custom format string
 * @param defaultFormat - Default format if no custom format provided
 * @returns Formatted time string
 */
export function formatConvertedTime(
  date: Date,
  timezone: string,
  customFormat: string | undefined,
  defaultFormat: string,
): string {
  // Lazy import to avoid circular dependencies
  const { formatInTimeZone } = require('date-fns-tz');
  
  const format = customFormat ?? defaultFormat;
  debug.tools('Formatting time in %s with format: %s', timezone, format);
  return formatInTimeZone(date, timezone, format);
}

/**
 * Handle conversion errors with proper error codes
 * @param error - The error that occurred
 * @param format - The format that was being used
 * @throws Properly formatted error with TimeServerErrorCodes
 */
export function handleConversionError(
  error: unknown,
  format: string,
): never {
  debug.tools('Handling conversion error: %O', error);
  
  if (
    error instanceof RangeError ||
    (error instanceof Error && error.message.includes('format'))
  ) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid format: ${error.message}`,
        { format, error: error.message },
      ),
    };
  }
  
  // Re-throw unknown errors
  throw error;
}