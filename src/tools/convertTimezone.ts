import { parseISO, isValid } from 'date-fns';
import { formatInTimeZone, getTimezoneOffset, toDate } from 'date-fns-tz';
import { cache, CacheTTL } from '../cache/timeCache';
import { hashCacheKey } from '../cache/cacheKeyHash';
import {
  validateTimezone,
  createError,
  validateDateString,
  validateStringLength,
  LIMITS,
} from '../utils/validation';
import { TimeServerErrorCodes } from '../types';
import type { ConvertTimezoneParams, ConvertTimezoneResult } from '../types';

export function convertTimezone(params: ConvertTimezoneParams): ConvertTimezoneResult {
  const { time, from_timezone, to_timezone } = params;

  // Validate string lengths first
  if (typeof time === 'string') {
    validateDateString(time, 'time');
  }
  if (params.format) {
    validateStringLength(params.format, LIMITS.MAX_FORMAT_LENGTH, 'format');
  }

  const format = params.format ?? "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";

  // Generate cache key
  const rawCacheKey = `convert_${time}_${from_timezone}_${to_timezone}_${format}`;
  const cacheKey = hashCacheKey(rawCacheKey);

  // Check cache
  const cached = cache.get<ConvertTimezoneResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Validate timezones
  if (!validateTimezone(from_timezone)) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_TIMEZONE,
        `Invalid from_timezone: ${from_timezone}`,
        { timezone: from_timezone, field: 'from_timezone' },
      ),
    };
  }

  if (!validateTimezone(to_timezone)) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_TIMEZONE,
        `Invalid to_timezone: ${to_timezone}`,
        { timezone: to_timezone, field: 'to_timezone' },
      ),
    };
  }

  let utcDate: Date;
  let actualFromTimezone = from_timezone;

  try {
    // Handle different input formats
    if (/^\d+$/.test(time)) {
      // Unix timestamp
      const timestamp = parseInt(time, 10);
      if (isNaN(timestamp)) {
        throw new Error('Invalid Unix timestamp');
      }
      utcDate = new Date(timestamp * 1000);
      actualFromTimezone = 'UTC'; // Unix timestamps are always UTC
    } else {
      // Parse the time string
      const parsed = parseISO(time);

      // Check if the input has timezone information
      if (time.includes('Z') || /[+-]\d{2}:\d{2}/.test(time)) {
        // Has timezone info, use it directly
        utcDate = parsed;
        // For display purposes, we'll need to show the original with its offset
        // This will be handled in the formatting section
      } else {
        // No timezone info, treat as being in from_timezone
        utcDate = toDate(time, { timeZone: from_timezone });
      }
    }

    if (!isValid(utcDate)) {
      throw new Error('Invalid date');
    }
  } catch (error) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_DATE_FORMAT, `Invalid time format: ${time}`, {
        time,
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }

  try {
    // Get offsets
    const fromOffset = getTimezoneOffset(actualFromTimezone, utcDate);
    const toOffset = getTimezoneOffset(to_timezone, utcDate);
    const difference = (toOffset - fromOffset) / 1000 / 60; // in minutes

    // Format the times
    let original: string;

    // For inputs with explicit offset, preserve the original format
    if (/[+-]\d{2}:\d{2}/.test(time) && time.includes('T')) {
      // Extract the offset from the original input
      const offsetMatch = time.match(/([+-]\d{2}:\d{2})$/);
      if (offsetMatch) {
        const baseTime = time.substring(0, time.lastIndexOf(offsetMatch[0]));
        // Check if milliseconds are already present
        if (baseTime.includes('.')) {
          original = time; // Use original as-is
        } else {
          original = `${baseTime}.000${offsetMatch[0]}`;
        }
      } else {
        original = formatInTimeZone(utcDate, actualFromTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
      }
    } else {
      original = formatInTimeZone(utcDate, actualFromTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
    }

    let converted: string;

    // Apply custom format only to the converted time if specified
    if (params.format) {
      converted = formatInTimeZone(utcDate, to_timezone, params.format);
    } else {
      converted = formatInTimeZone(utcDate, to_timezone, format);
    }

    // Get offset strings
    let fromOffsetStr: string;

    // For inputs with explicit offset, use that offset
    if (/[+-]\d{2}:\d{2}/.test(time)) {
      const offsetMatch = time.match(/([+-]\d{2}:\d{2})$/);
      fromOffsetStr = offsetMatch
        ? offsetMatch[0]
        : formatInTimeZone(utcDate, actualFromTimezone, 'XXX');
    } else if (time.includes('Z')) {
      fromOffsetStr = 'Z';
    } else {
      fromOffsetStr =
        actualFromTimezone === 'UTC' ? 'Z' : formatInTimeZone(utcDate, actualFromTimezone, 'XXX');
    }

    const toOffsetStr = to_timezone === 'UTC' ? 'Z' : formatInTimeZone(utcDate, to_timezone, 'XXX');

    const result: ConvertTimezoneResult = {
      original,
      converted,
      from_offset: fromOffsetStr,
      to_offset: toOffsetStr,
      difference,
    };

    // Cache the result
    cache.set(cacheKey, result, CacheTTL.TIMEZONE_CONVERT);

    return result;
  } catch (error: unknown) {
    // Handle format errors
    if (
      error instanceof RangeError ||
      (error instanceof Error && error.message.includes('format'))
    ) {
      throw {
        error: createError(
          TimeServerErrorCodes.INVALID_DATE_FORMAT,
          `Invalid format: ${error.message}`,
          { format: params.format ?? format, error: error.message },
        ),
      };
    }
    throw error;
  }
}
