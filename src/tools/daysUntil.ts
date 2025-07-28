import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { cache, CacheTTL } from '../cache/timeCache';
import { hashCacheKey } from '../cache/cacheKeyHash';
import { validateTimezone, createError, validateStringLength, LIMITS } from '../utils/validation';
import { getConfig } from '../utils/config';
import { TimeServerErrorCodes } from '../types';
import type { DaysUntilParams, DaysUntilResult } from '../types';

/**
 * Calculate days until a target date
 * @param params - The parameters for the calculation
 * @returns Number of days or formatted string
 */
export function daysUntil(params: DaysUntilParams): DaysUntilResult {
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
  const timezone = userTimezone === undefined ? defaultTimezone : userTimezone || 'UTC';

  // Create cache key
  const rawCacheKey = `days_until:${target_date}:${timezone}:${format_result}`;
  const cacheKey = hashCacheKey(rawCacheKey);
  const cached = cache.get<DaysUntilResult>(cacheKey);
  if (cached !== undefined) {
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
  try {
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
  } catch (error) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid target_date format: ${target_date}`,
        {
          target_date,
          error: error instanceof Error ? error.message : String(error),
        },
      ),
    };
  }

  // Get current date in the specified timezone
  const now = new Date();

  // Convert both dates to the specified timezone for calendar day comparison
  const nowInTimezone = timezone === 'UTC' ? now : toZonedTime(now, timezone);
  const targetInTimezone = timezone === 'UTC' ? targetDate : toZonedTime(targetDate, timezone);

  // Calculate calendar days difference
  const daysUntil = differenceInCalendarDays(targetInTimezone, nowInTimezone);

  let result: DaysUntilResult;

  if (format_result) {
    // Format the result as a human-readable string
    if (daysUntil === 0) {
      result = 'Today';
    } else if (daysUntil === 1) {
      result = 'Tomorrow';
    } else if (daysUntil === -1) {
      result = 'Yesterday';
    } else if (daysUntil > 0) {
      result = `in ${daysUntil} days`;
    } else {
      result = `${Math.abs(daysUntil)} days ago`;
    }
  } else {
    // Return just the number
    result = daysUntil;
  }

  // Cache the result with appropriate TTL
  // Use CURRENT_TIME for "today" (changes frequently), CALCULATIONS for future/past dates
  const ttl = Math.abs(daysUntil) === 0 ? CacheTTL.CURRENT_TIME : CacheTTL.CALCULATIONS;
  cache.set(cacheKey, result, ttl);

  return result;
}
