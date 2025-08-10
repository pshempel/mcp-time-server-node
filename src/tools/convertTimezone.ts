import { formatInTimeZone, getTimezoneOffset } from 'date-fns-tz';

import { ValidationError, TimezoneError, DateParsingError } from '../adapters/mcp-sdk';
import { CacheTTL } from '../cache/timeCache';
import type { ConvertTimezoneParams, ConvertTimezoneResult } from '../types';
import { debug } from '../utils/debug';
import { parseTimeInput } from '../utils/parseTimeInput';
import {
  validateTimezone,
  validateDateString,
  validateStringLength,
  LIMITS,
} from '../utils/validation';
import { withCache } from '../utils/withCache';

/**
 * Validates both from and to timezones
 * @param from_timezone - Source timezone
 * @param to_timezone - Target timezone
 * @throws Error with proper error code if either timezone is invalid
 */
export function validateTimezones(from_timezone: string, to_timezone: string): void {
  debug.validation('validateTimezones called with: from=%s, to=%s', from_timezone, to_timezone);

  // Validate from_timezone
  if (!validateTimezone(from_timezone)) {
    debug.validation('Invalid from_timezone: %s', from_timezone);
    debug.error('Invalid from_timezone: %s', from_timezone);
    throw new TimezoneError(`Invalid from_timezone: ${from_timezone}`, from_timezone);
  }

  // Validate to_timezone
  if (!validateTimezone(to_timezone)) {
    debug.validation('Invalid to_timezone: %s', to_timezone);
    debug.error('Invalid to_timezone: %s', to_timezone);
    throw new TimezoneError(`Invalid to_timezone: ${to_timezone}`, to_timezone);
  }

  debug.validation('Timezone validation passed');
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
  debug.parse('parseDateForConversion called with: time=%s, from_timezone=%s', time, from_timezone);

  try {
    const parseResult = parseTimeInput(time, from_timezone);
    let actualFromTimezone: string;

    if (parseResult.hasExplicitTimezone) {
      // For explicit timezone info, preserve the source behavior:
      // - UTC/Z -> UTC
      // - Offset -> keep original from_timezone for display purposes
      if (parseResult.detectedTimezone === 'UTC') {
        actualFromTimezone = 'UTC';
      } else {
        actualFromTimezone = from_timezone; // Keep original for offset display
      }
    } else {
      actualFromTimezone = from_timezone;
    }

    debug.parse(
      'Parsed date: %s, actualFromTimezone: %s',
      parseResult.date.toISOString(),
      actualFromTimezone
    );

    return { date: parseResult.date, actualFromTimezone };
  } catch (error) {
    debug.parse('Date parsing failed: %O', error);
    debug.error('Invalid time format: %s, error: %O', time, error);
    throw new DateParsingError(`Invalid time format: ${time}`, {
      time,
      error: error instanceof Error ? error.message : String(error),
    });
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
  debug.timezone(
    'formatOriginalTime called with: date=%s, originalTime=%s, timezone=%s',
    date.toISOString(),
    originalTime,
    timezone
  );

  // For inputs with explicit offset, preserve the original format
  if (/[+-]\d{2}:\d{2}/.test(originalTime) && originalTime.includes('T')) {
    debug.timezone('Preserving explicit offset format');
    // Extract the offset from the original input
    const offsetMatch = originalTime.match(/([+-]\d{2}:\d{2})$/);
    if (offsetMatch) {
      const baseTime = originalTime.substring(0, originalTime.lastIndexOf(offsetMatch[0]));
      // Check if milliseconds are already present
      if (baseTime.includes('.')) {
        debug.timezone('Using original format as-is: %s', originalTime);
        return originalTime; // Use original as-is
      } else {
        const result = `${baseTime}.000${offsetMatch[0]}`;
        debug.timezone('Added milliseconds to explicit offset: %s', result);
        return result;
      }
    }
  }

  // For UTC/Z format
  if (originalTime.includes('Z') || timezone === 'UTC') {
    const result = formatInTimeZone(date, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    debug.timezone('Formatted as UTC: %s', result);
    return result;
  }

  // Format in the specified timezone
  const result = formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
  debug.timezone('Formatted in timezone %s: %s', timezone, result);
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
  debug.timezone(
    'extractOffsetString called with: originalTime=%s, date=%s, timezone=%s',
    originalTime,
    date.toISOString(),
    timezone
  );

  // For inputs with explicit offset, use that offset
  if (/[+-]\d{2}:\d{2}/.test(originalTime)) {
    const offsetMatch = originalTime.match(/([+-]\d{2}:\d{2})$/);
    if (offsetMatch) {
      debug.timezone('Using explicit offset: %s', offsetMatch[0]);
      return offsetMatch[0];
    }
  }

  // Check for Z suffix
  if (originalTime.includes('Z')) {
    debug.timezone('Using Z for UTC suffix');
    return 'Z';
  }

  // For UTC timezone
  if (timezone === 'UTC') {
    debug.timezone('Using Z for UTC timezone');
    return 'Z';
  }

  // Format offset for the timezone
  const offset = formatInTimeZone(date, timezone, 'XXX');
  debug.timezone('Formatted offset for %s: %s', timezone, offset);
  return offset;
}

/**
 * Handle conversion errors with proper error formatting
 * @param error - The error that occurred
 * @param format - The format string that was being used
 * @throws Properly formatted error with TimeServerErrorCodes
 */
function handleConversionError(error: unknown, format: string): never {
  debug.error('Handling conversion error: %O', error);

  if (error instanceof RangeError || (error instanceof Error && error.message.includes('format'))) {
    throw new ValidationError(`Invalid format: ${error.message}`, { format, error: error.message });
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
  debug.timezone('Formatting converted time in %s with format: %s', timezone, format);
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
  debug.timezone('convertTimezone called with: %O', params);
  const { time, from_timezone, to_timezone } = params;

  // Validate string lengths first
  if (typeof time === 'string') validateDateString(time, 'time');
  if (params.format) validateStringLength(params.format, LIMITS.MAX_FORMAT_LENGTH, 'format');

  const format = params.format ?? "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";

  // Use withCache wrapper instead of manual cache management
  return withCache(
    `convert_${time}_${from_timezone}_${to_timezone}_${format}`,
    CacheTTL.TIMEZONE_CONVERT,
    () => {
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

        debug.timezone('convertTimezone returning: %O', result);
        return result;
      } catch (error: unknown) {
        handleConversionError(error, params.format ?? format);
      }
    }
  );
}
