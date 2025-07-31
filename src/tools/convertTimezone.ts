import { parseISO, isValid } from 'date-fns';
import { formatInTimeZone, getTimezoneOffset, toDate } from 'date-fns-tz';

import { hashCacheKey } from '../cache/cacheKeyHash';
import { cache, CacheTTL } from '../cache/timeCache';
import { TimeServerErrorCodes } from '../types';
import type { ConvertTimezoneParams, ConvertTimezoneResult } from '../types';
import { debug } from '../utils/debug';
import {
  validateTimezone,
  createError,
  validateDateString,
  validateStringLength,
  LIMITS,
} from '../utils/validation';

/**
 * Validates both from and to timezones
 * @param from_timezone - Source timezone
 * @param to_timezone - Target timezone
 * @throws Error with proper error code if either timezone is invalid
 */
export function validateTimezones(from_timezone: string, to_timezone: string): void {
  debug.tools('validateTimezones called with: from=%s, to=%s', from_timezone, to_timezone);

  // Validate from_timezone
  if (!validateTimezone(from_timezone)) {
    debug.tools('Invalid from_timezone: %s', from_timezone);
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_TIMEZONE,
        `Invalid from_timezone: ${from_timezone}`,
        { timezone: from_timezone, field: 'from_timezone' }
      ),
    };
  }

  // Validate to_timezone
  if (!validateTimezone(to_timezone)) {
    debug.tools('Invalid to_timezone: %s', to_timezone);
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_TIMEZONE,
        `Invalid to_timezone: ${to_timezone}`,
        { timezone: to_timezone, field: 'to_timezone' }
      ),
    };
  }

  debug.tools('Timezone validation passed');
}

/**
 * Parses the input time string and determines the UTC date and actual source timezone
 * @param time - The time string to parse (ISO, Unix timestamp, or local time)
 * @param from_timezone - The timezone to interpret local times in
 * @returns Object with the UTC date and the actual source timezone
 * @throws Error with proper error code if the date format is invalid
 */
export function parseDateForConversion(
  time: string,
  from_timezone: string
): { date: Date; actualFromTimezone: string } {
  debug.tools('parseDateForConversion called with: time=%s, from_timezone=%s', time, from_timezone);

  let utcDate: Date;
  let actualFromTimezone = from_timezone;

  try {
    // Handle different input formats
    if (/^\d+$/.test(time)) {
      // Unix timestamp
      debug.tools('Parsing as Unix timestamp');
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
        debug.tools('Input has timezone info, using directly');
        // Has timezone info, use it directly
        utcDate = parsed;
        // For display purposes, we'll need to show the original with its offset
        // This will be handled in the formatting section
      } else {
        debug.tools('No timezone info, treating as local time in %s', from_timezone);
        // No timezone info, treat as being in from_timezone
        utcDate = toDate(time, { timeZone: from_timezone });
      }
    }

    if (!isValid(utcDate)) {
      throw new Error('Invalid date');
    }

    debug.tools(
      'Parsed date: %s, actualFromTimezone: %s',
      utcDate.toISOString(),
      actualFromTimezone
    );
    return { date: utcDate, actualFromTimezone };
  } catch (error) {
    debug.tools('Date parsing failed: %O', error);
    throw {
      error: createError(TimeServerErrorCodes.INVALID_DATE_FORMAT, `Invalid time format: ${time}`, {
        time,
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}

/**
 * Formats the original time preserving explicit offset format when present
 * @param date - The parsed UTC date
 * @param originalTime - The original time string input
 * @param timezone - The timezone to use for formatting if no explicit offset
 * @returns Formatted time string with appropriate offset
 */
export function formatOriginalTime(date: Date, originalTime: string, timezone: string): string {
  debug.tools(
    'formatOriginalTime called with: date=%s, originalTime=%s, timezone=%s',
    date.toISOString(),
    originalTime,
    timezone
  );

  // For inputs with explicit offset, preserve the original format
  if (/[+-]\d{2}:\d{2}/.test(originalTime) && originalTime.includes('T')) {
    debug.tools('Preserving explicit offset format');
    // Extract the offset from the original input
    const offsetMatch = originalTime.match(/([+-]\d{2}:\d{2})$/);
    if (offsetMatch) {
      const baseTime = originalTime.substring(0, originalTime.lastIndexOf(offsetMatch[0]));
      // Check if milliseconds are already present
      if (baseTime.includes('.')) {
        debug.tools('Using original format as-is: %s', originalTime);
        return originalTime; // Use original as-is
      } else {
        const result = `${baseTime}.000${offsetMatch[0]}`;
        debug.tools('Added milliseconds to explicit offset: %s', result);
        return result;
      }
    }
  }

  // For UTC/Z format
  if (originalTime.includes('Z') || timezone === 'UTC') {
    const result = formatInTimeZone(date, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    debug.tools('Formatted as UTC: %s', result);
    return result;
  }

  // Format in the specified timezone
  const result = formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
  debug.tools('Formatted in timezone %s: %s', timezone, result);
  return result;
}

/**
 * Extracts or formats the offset string for a given time and timezone
 * @param originalTime - The original time string input
 * @param date - The parsed UTC date
 * @param timezone - The timezone to use for offset calculation
 * @returns The offset string (e.g., '+05:00', '-08:00', 'Z')
 */
export function extractOffsetString(originalTime: string, date: Date, timezone: string): string {
  debug.tools(
    'extractOffsetString called with: originalTime=%s, date=%s, timezone=%s',
    originalTime,
    date.toISOString(),
    timezone
  );

  // For inputs with explicit offset, use that offset
  if (/[+-]\d{2}:\d{2}/.test(originalTime)) {
    const offsetMatch = originalTime.match(/([+-]\d{2}:\d{2})$/);
    if (offsetMatch) {
      debug.tools('Using explicit offset: %s', offsetMatch[0]);
      return offsetMatch[0];
    }
  }

  // Check for Z suffix
  if (originalTime.includes('Z')) {
    debug.tools('Using Z for UTC suffix');
    return 'Z';
  }

  // For UTC timezone
  if (timezone === 'UTC') {
    debug.tools('Using Z for UTC timezone');
    return 'Z';
  }

  // Format offset for the timezone
  const offset = formatInTimeZone(date, timezone, 'XXX');
  debug.tools('Formatted offset for %s: %s', timezone, offset);
  return offset;
}

/**
 * Handle conversion errors with proper error formatting
 * @param error - The error that occurred
 * @param format - The format string that was being used
 * @throws Properly formatted error with TimeServerErrorCodes
 */
function handleConversionError(error: unknown, format: string): never {
  debug.tools('Handling conversion error: %O', error);

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

/**
 * Format the converted time with optional custom format
 * @param date - The UTC date to format
 * @param timezone - The target timezone
 * @param customFormat - Optional custom format from params
 * @param defaultFormat - Default format to use if no custom format
 * @returns Formatted time string
 */
function formatConvertedTime(
  date: Date,
  timezone: string,
  customFormat: string | undefined,
  defaultFormat: string
): string {
  const format = customFormat ?? defaultFormat;
  debug.tools('Formatting converted time in %s with format: %s', timezone, format);
  return formatInTimeZone(date, timezone, format);
}

/**
 * Build the conversion result object
 * @param original - Original formatted time
 * @param converted - Converted formatted time
 * @param fromOffsetStr - Source timezone offset
 * @param toOffsetStr - Target timezone offset
 * @param difference - Difference in minutes between timezones
 * @returns ConvertTimezoneResult object
 */
function buildConversionResult(
  original: string,
  converted: string,
  fromOffsetStr: string,
  toOffsetStr: string,
  difference: number
): ConvertTimezoneResult {
  return {
    original,
    converted,
    from_offset: fromOffsetStr,
    to_offset: toOffsetStr,
    difference,
  };
}

export function convertTimezone(params: ConvertTimezoneParams): ConvertTimezoneResult {
  debug.tools('convertTimezone called with: %O', params);
  const { time, from_timezone, to_timezone } = params;

  // Validate string lengths first
  if (typeof time === 'string') validateDateString(time, 'time');
  if (params.format) validateStringLength(params.format, LIMITS.MAX_FORMAT_LENGTH, 'format');

  const format = params.format ?? "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";

  // Generate cache key
  const rawCacheKey = `convert_${time}_${from_timezone}_${to_timezone}_${format}`;
  const cacheKey = hashCacheKey(rawCacheKey);

  // Check cache
  const cached = cache.get<ConvertTimezoneResult>(cacheKey);
  if (cached) return cached;

  // Validate timezones
  validateTimezones(from_timezone, to_timezone);

  // Parse the input time
  const { date: utcDate, actualFromTimezone } = parseDateForConversion(time, from_timezone);

  try {
    // Get offsets
    const fromOffset = getTimezoneOffset(actualFromTimezone, utcDate);
    const toOffset = getTimezoneOffset(to_timezone, utcDate);
    const difference = (toOffset - fromOffset) / 1000 / 60; // in minutes

    // Format the times
    const original = formatOriginalTime(utcDate, time, actualFromTimezone);

    // Format the converted time
    const converted = formatConvertedTime(utcDate, to_timezone, params.format, format);

    // Get offset strings
    const fromOffsetStr = extractOffsetString(time, utcDate, actualFromTimezone);
    const toOffsetStr = extractOffsetString('', utcDate, to_timezone);

    const result = buildConversionResult(
      original,
      converted,
      fromOffsetStr,
      toOffsetStr,
      difference
    );

    // Cache the result
    cache.set(cacheKey, result, CacheTTL.TIMEZONE_CONVERT);

    debug.tools('convertTimezone returning: %O', result);
    return result;
  } catch (error: unknown) {
    handleConversionError(error, params.format ?? format);
  }
}
