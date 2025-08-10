import { formatInTimeZone } from 'date-fns-tz';

import { ValidationError, TimezoneError } from '../adapters/mcp-sdk';
import { CacheTTL } from '../cache/timeCache';
import type { GetCurrentTimeParams, GetCurrentTimeResult } from '../types';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { resolveTimezone } from '../utils/timezoneUtils';
import { validateTimezone, validateStringLength, LIMITS } from '../utils/validation';
import { withCache } from '../utils/withCache';

/**
 * Generates cache key for current time request
 * Note: Now only used for generating the raw cache key for withCache
 */
export function getCacheKey(timezone: string, format: string, includeOffset: boolean): string {
  return `current_${timezone}_${format}_${includeOffset}`;
}

/**
 * Formats time with the appropriate options based on parameters
 */
export function formatTimeWithOptions(
  now: Date,
  timezone: string,
  params: GetCurrentTimeParams,
  defaultFormat: string
): string {
  if (params.include_offset !== false && !params.format) {
    // Default format includes offset
    return formatInTimeZone(now, timezone, defaultFormat);
  } else if (params.include_offset === false && params.format) {
    // Custom format without offset - use the format as-is
    return formatInTimeZone(now, timezone, params.format);
  } else {
    // Use format string as provided (default or custom)
    return formatInTimeZone(now, timezone, defaultFormat);
  }
}

/**
 * Builds the time result object
 */
export function buildTimeResult(
  now: Date,
  formattedTime: string,
  timezone: string
): GetCurrentTimeResult {
  // Get offset separately for the result object
  const offset = timezone === 'UTC' ? 'Z' : formatInTimeZone(now, timezone, 'XXX');

  return {
    time: formattedTime,
    timezone: timezone,
    offset: offset,
    unix: Math.floor(now.getTime() / 1000),
    iso: formatInTimeZone(now, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
  };
}

/**
 * Handles format errors from date-fns
 */
export function handleFormatError(error: unknown, format: string): never {
  if (error instanceof RangeError || (error instanceof Error && error.message.includes('format'))) {
    throw new ValidationError(`Invalid format: ${error.message}`, { format, error: error.message });
  }
  throw error;
}

export function getCurrentTime(params: GetCurrentTimeParams): GetCurrentTimeResult {
  debug.timezone('getCurrentTime called with params: %O', params);

  // Validate format string length first
  if (params.format) {
    validateStringLength(params.format, LIMITS.MAX_FORMAT_LENGTH, 'format');
  }

  // Resolve timezone with proper empty string handling
  const config = getConfig();
  const timezone = resolveTimezone(params.timezone, config.defaultTimezone);
  const formatStr = params.format ?? "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";
  const includeOffset = params.include_offset !== false;

  // Use withCache wrapper instead of manual cache management
  return withCache(getCacheKey(timezone, formatStr, includeOffset), CacheTTL.CURRENT_TIME, () => {
    // Validate timezone
    if (!validateTimezone(timezone)) {
      throw new TimezoneError(`Invalid timezone: ${timezone}`, timezone);
    }

    const now = new Date();

    try {
      // Format time with appropriate options
      const formattedTime = formatTimeWithOptions(now, timezone, params, formatStr);

      // Build result
      const result = buildTimeResult(now, formattedTime, timezone);

      return result;
    } catch (error: unknown) {
      handleFormatError(error, params.format ?? formatStr);
    }
  });
}
