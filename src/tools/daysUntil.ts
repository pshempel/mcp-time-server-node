import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { hashCacheKey } from '../cache/cacheKeyHash';
import { cache, CacheTTL } from '../cache/timeCache';
import { TimeServerErrorCodes } from '../types';
import type { DaysUntilParams, DaysUntilResult } from '../types';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { validateTimezone, createError, validateStringLength, LIMITS } from '../utils/validation';

/**
 * Resolve timezone parameter
 */
export function resolveTimezone(userTimezone: string | undefined, defaultTimezone: string): string {
  return userTimezone === undefined ? defaultTimezone : userTimezone || 'UTC';
}

/**
 * Parse target date from various formats
 */
export function parseTargetDate(target_date: string | number): Date {
  let targetDate: Date;

  // Check if it's a Unix timestamp
  if (typeof target_date === 'string' && /^\d+$/.test(target_date)) {
    const timestamp = parseInt(target_date, 10);
    if (isNaN(timestamp)) {
      throw new Error('Invalid Unix timestamp');
    }
    targetDate = new Date(timestamp * 1000);
  } else if (typeof target_date === 'number') {
    targetDate = new Date(target_date * 1000);
  } else {
    // Parse as ISO string or other format
    targetDate = parseISO(target_date);
  }

  if (!isValid(targetDate)) {
    throw new Error('Invalid date');
  }

  return targetDate;
}

/**
 * Convert date to specified timezone
 */
export function convertToTimezone(date: Date, timezone: string): Date {
  return timezone === 'UTC' ? date : toZonedTime(date, timezone);
}

/**
 * Format days until as human-readable string
 */
export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/**
 * Get appropriate cache TTL based on days until
 */
export function getCacheTTL(daysUntil: number): number {
  return Math.abs(daysUntil) === 0 ? CacheTTL.CURRENT_TIME : CacheTTL.CALCULATIONS;
}

/**
 * Calculate days until a target date
 * @param params - The parameters for the calculation
 * @returns Number of days or formatted string
 */
// eslint-disable-next-line max-lines-per-function
export function daysUntil(params: DaysUntilParams): DaysUntilResult {
  debug.tools('daysUntil called with params: %O', params);
  // Validate required parameter
  if (!params.target_date) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_PARAMETER, 'target_date is required'),
    };
  }

  // Validate string length first (general limit for very long strings)
  if (typeof params.target_date === 'string') {
    validateStringLength(params.target_date, LIMITS.MAX_STRING_LENGTH, 'target_date');
  }

  const { target_date, timezone: userTimezone, format_result = false } = params;
  const { defaultTimezone } = getConfig();
  const timezone = resolveTimezone(userTimezone, defaultTimezone);
  debug.tools('Resolved timezone: %s', timezone);

  // Create cache key
  const rawCacheKey = `days_until:${target_date}:${timezone}:${format_result}`;
  debug.tools('Cache key (raw): %s', rawCacheKey);
  const cacheKey = hashCacheKey(rawCacheKey);
  const cached = cache.get<DaysUntilResult>(cacheKey);
  if (cached !== undefined) {
    debug.tools('Returning cached result');
    return cached;
  }

  // Validate timezone if provided
  if (userTimezone !== undefined && !validateTimezone(timezone)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_TIMEZONE, `Invalid timezone: ${timezone}`, {
        timezone,
      }),
    };
  }

  // Parse target date
  let targetDate: Date;
  debug.tools('Parsing target_date: %s', target_date);
  try {
    targetDate = parseTargetDate(target_date);
    debug.tools('Parsed date: %s', targetDate.toISOString());
  } catch (error) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid target_date format: ${target_date}`,
        {
          target_date,
          error: error instanceof Error ? error.message : String(error),
        }
      ),
    };
  }

  // Get current date in the specified timezone
  const now = new Date();
  debug.tools('Current time: %s', now.toISOString());

  // Convert both dates to the specified timezone for calendar day comparison
  const nowInTimezone = convertToTimezone(now, timezone);
  const targetInTimezone = convertToTimezone(targetDate, timezone);
  debug.tools('Now in timezone: %s', nowInTimezone.toISOString());
  debug.tools('Target in timezone: %s', targetInTimezone.toISOString());

  // Calculate calendar days difference
  const daysUntil = differenceInCalendarDays(targetInTimezone, nowInTimezone);
  debug.tools('Days until: %d', daysUntil);

  let result: DaysUntilResult;

  if (format_result) {
    // Format the result as a human-readable string
    result = formatDaysUntil(daysUntil);
    debug.tools('Formatted result: %s', result);
  } else {
    // Return just the number
    result = daysUntil;
  }

  // Cache the result with appropriate TTL
  // Use CURRENT_TIME for "today" (changes frequently), CALCULATIONS for future/past dates
  const ttl = getCacheTTL(daysUntil);
  cache.set(cacheKey, result, ttl);
  debug.tools('Result cached with TTL: %d', ttl);

  return result;
}
