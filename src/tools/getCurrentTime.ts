import { formatInTimeZone } from 'date-fns-tz';

import { hashCacheKey } from '../cache/cacheKeyHash';
import { cache, CacheTTL } from '../cache/timeCache';
import { TimeServerErrorCodes } from '../types';
import type { GetCurrentTimeParams, GetCurrentTimeResult } from '../types';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { validateTimezone, createError, validateStringLength, LIMITS } from '../utils/validation';

/**
 * Resolves the effective timezone based on input
 * CRITICAL: Empty string "" = UTC, undefined = system timezone
 */
export function resolveTimezone(
  timezone: string | undefined,
  config: { defaultTimezone: string }
): string {
  debug.tools('Resolving timezone: input=%s, default=%s', timezone, config.defaultTimezone);

  // Empty string explicitly means UTC (Unix convention)
  if (timezone === '') {
    debug.tools('Empty string timezone -> UTC');
    return 'UTC';
  }

  // Undefined/missing means system timezone (LLM friendly)
  const resolved = timezone ?? config.defaultTimezone;
  debug.tools('Resolved timezone: %s', resolved);
  return resolved;
}

/**
 * Generates cache key for current time request
 */
export function getCacheKey(timezone: string, format: string, includeOffset: boolean): string {
  const rawCacheKey = `current_${timezone}_${format}_${includeOffset}`;
  return hashCacheKey(rawCacheKey);
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
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid format: ${error.message}`,
        { format, error: error.message }
      ),
    };
  }
  throw error;
}

export function getCurrentTime(params: GetCurrentTimeParams): GetCurrentTimeResult {
  debug.tools('getCurrentTime called with params: %O', params);

  // Validate format string length first
  if (params.format) {
    validateStringLength(params.format, LIMITS.MAX_FORMAT_LENGTH, 'format');
  }

  // Resolve timezone with proper empty string handling
  const config = getConfig();
  const timezone = resolveTimezone(params.timezone, config);
  const formatStr = params.format ?? "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";
  const includeOffset = params.include_offset !== false;

  // Generate and check cache
  const cacheKey = getCacheKey(timezone, formatStr, includeOffset);
  const cached = cache.get<GetCurrentTimeResult>(cacheKey);
  if (cached) {
    debug.tools('Returning cached result for key: %s', cacheKey);
    return cached;
  }

  // Validate timezone
  if (!validateTimezone(timezone)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_TIMEZONE, `Invalid timezone: ${timezone}`, {
        timezone,
      }),
    };
  }

  const now = new Date();

  try {
    // Format time with appropriate options
    const formattedTime = formatTimeWithOptions(now, timezone, params, formatStr);

    // Build result
    const result = buildTimeResult(now, formattedTime, timezone);

    // Cache and return
    cache.set(cacheKey, result, CacheTTL.CURRENT_TIME);
    debug.tools('Cached result with key: %s', cacheKey);

    return result;
  } catch (error: unknown) {
    handleFormatError(error, params.format ?? formatStr);
  }
}
