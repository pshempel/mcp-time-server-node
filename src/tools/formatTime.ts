import { startOfDay, differenceInDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

import { ValidationError, TimezoneError, DateParsingError } from '../adapters/mcp-sdk';
import { CacheTTL } from '../cache/timeCache';
import type { FormatTimeParams, FormatTimeResult } from '../types';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { parseTimeInput } from '../utils/parseTimeInput';
import { resolveTimezone } from '../utils/timezoneUtils';
import {
  validateTimezone,
  validateDateString,
  validateStringLength,
  LIMITS,
} from '../utils/validation';
import { withCache } from '../utils/withCache';

/**
 * Format tokens organized by category for better maintainability
 * Frozen to prevent accidental modification
 */
export const FORMAT_TOKENS = Object.freeze({
  era: Object.freeze(['G', 'GG', 'GGG', 'GGGG', 'GGGGG']),
  year: Object.freeze(['y', 'yo', 'yy', 'yyy', 'yyyy', 'yyyyy']),
  localWeekYear: Object.freeze(['Y', 'Yo', 'YY', 'YYY', 'YYYY', 'YYYYY']),
  isoWeekYear: Object.freeze(['R', 'RR', 'RRR', 'RRRR', 'RRRRR']),
  extendedYear: Object.freeze(['u', 'uu', 'uuu', 'uuuu', 'uuuuu']),
  quarter: Object.freeze([
    'Q',
    'Qo',
    'QQ',
    'QQQ',
    'QQQQ',
    'QQQQQ',
    'q',
    'qo',
    'qq',
    'qqq',
    'qqqq',
    'qqqqq',
  ]),
  month: Object.freeze([
    'M',
    'Mo',
    'MM',
    'MMM',
    'MMMM',
    'MMMMM',
    'L',
    'Lo',
    'LL',
    'LLL',
    'LLLL',
    'LLLLL',
  ]),
  week: Object.freeze(['w', 'wo', 'ww', 'I', 'Io', 'II']),
  day: Object.freeze([
    'd',
    'do',
    'dd',
    'D',
    'Do',
    'DD',
    'DDD',
    'E',
    'EE',
    'EEE',
    'EEEE',
    'EEEEE',
    'EEEEEE',
    'e',
    'eo',
    'ee',
    'eee',
    'eeee',
    'eeeee',
    'eeeeee',
    'c',
    'co',
    'cc',
    'ccc',
    'cccc',
    'ccccc',
    'cccccc',
    'i',
    'io',
    'ii',
    'iii',
    'iiii',
    'iiiii',
    'iiiiii',
  ]),
  period: Object.freeze([
    'a',
    'aa',
    'aaa',
    'aaaa',
    'aaaaa',
    'b',
    'bb',
    'bbb',
    'bbbb',
    'bbbbb',
    'B',
    'BB',
    'BBB',
    'BBBB',
    'BBBBB',
  ]),
  hour: Object.freeze(['h', 'ho', 'hh', 'H', 'Ho', 'HH', 'K', 'Ko', 'KK', 'k', 'ko', 'kk']),
  minute: Object.freeze(['m', 'mo', 'mm']),
  second: Object.freeze(['s', 'so', 'ss']),
  fraction: Object.freeze(['S', 'SS', 'SSS']),
  timezone: Object.freeze([
    'X',
    'XX',
    'XXX',
    'XXXX',
    'XXXXX',
    'x',
    'xx',
    'xxx',
    'xxxx',
    'xxxxx',
    'O',
    'OO',
    'OOO',
    'OOOO',
    'z',
    'zz',
    'zzz',
    'zzzz',
    'Z',
    'ZZ',
    'ZZZ',
    'ZZZZ',
    'ZZZZZ',
  ]),
  timestamp: Object.freeze(['t', 'T']),
});

/**
 * Get all valid tokens as a flat array (internal helper)
 */
function getAllTokens(): string[] {
  return Object.values(FORMAT_TOKENS).flat();
}

/**
 * Validates format string for security and correctness
 * Extracted to reduce complexity
 */
function isValidFormatString(format: string): boolean {
  debug.validation('isValidFormatString called with: %s', format);

  // Check for dangerous characters that should never appear
  const dangerousChars = /[;&|`$<>{}\\]/;
  if (dangerousChars.test(format)) {
    debug.validation('Format contains dangerous characters');
    return false;
  }

  // Build pattern from tokens
  const validTokens = getAllTokens();
  // eslint-disable-next-line security/detect-non-literal-regexp -- Building from known safe tokens
  const tokenPattern = new RegExp(`^(?:${validTokens.join('|')}|'[^']*'|[\\s\\-:.,/()\\[\\]])+$`);

  // Check if format string matches allowed pattern
  const isValid = tokenPattern.test(format);
  debug.validation('Format validation result: %s', isValid);
  return isValid;
}

/**
 * Validates formatTime parameters
 * Extracted to reduce main function complexity
 *
 * Note: This function is 52 lines (2 over the 50 line limit) but splitting it further
 * would create artificial boundaries that harm readability. The validation flow is
 * cohesive and logical as-is.
 */
// eslint-disable-next-line max-lines-per-function -- Splitting would harm readability (52 lines, cohesive validation logic)
export function validateFormatParams(params: FormatTimeParams): void {
  debug.validation('validateFormatParams called with: %O', params);

  // Validate string lengths first
  if (typeof params.time === 'string') {
    validateDateString(params.time, 'time');
  }
  if (params.custom_format) {
    validateStringLength(params.custom_format, LIMITS.MAX_FORMAT_LENGTH, 'custom_format');
  }

  const formatType = params.format.toLowerCase();

  // Validate format type
  const validFormats = ['relative', 'calendar', 'custom'];
  if (!validFormats.includes(formatType)) {
    debug.error('Invalid format type: %s', params.format);
    throw new ValidationError('Invalid format type', { format: params.format });
  }

  // Validate custom format requirements
  if (formatType === 'custom') {
    if (params.custom_format === undefined || params.custom_format === null) {
      debug.error('custom_format is required when format is "custom"');
      throw new ValidationError('custom_format is required when format is "custom"');
    }
    if (params.custom_format === '') {
      debug.error('custom_format cannot be empty');
      throw new ValidationError('custom_format cannot be empty', { custom_format: '' });
    }
  }

  // Validate timezone if provided
  if (params.timezone) {
    const config = getConfig();
    const timezone = resolveTimezone(params.timezone, config.defaultTimezone);
    if (!validateTimezone(timezone)) {
      debug.error('Invalid timezone: %s', timezone);
      throw new TimezoneError(`Invalid timezone: ${timezone}`, timezone);
    }
  }

  debug.validation('Parameter validation passed');
}

/**
 * Parse time input with fallback to native Date
 * Extracted to reduce complexity and improve testability
 */
export function parseTimeWithFallback(timeInput: string | number, timezone: string): Date {
  debug.parse('parseTimeWithFallback called with: %s, timezone: %s', timeInput, timezone);

  let date: Date;

  debug.parse('Attempting to parse with parseTimeInput');
  try {
    date = parseTimeInput(timeInput, timezone).date;
    debug.parse('Successfully parsed date: %s', date.toISOString());
  } catch (error) {
    debug.parse('parseTimeInput failed, trying fallback: %s', error);
    // Fallback to native Date constructor for graceful overflow handling
    try {
      debug.parse('Fallback to native Date constructor');
      date = new Date(timeInput);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      debug.parse('Fallback succeeded: %s', date.toISOString());
    } catch (fallbackError) {
      debug.parse('Fallback also failed: %s', fallbackError);
      debug.error('Invalid time: %s', timeInput);
      throw new DateParsingError('Invalid time', {
        time: timeInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return date;
}

/**
 * Format time as relative/calendar string
 * Extracted to reduce switch case complexity
 */
export function formatRelativeTime(date: Date, timezone: string): string {
  debug.timing(
    'formatRelativeTime called with date: %s, timezone: %s',
    date.toISOString(),
    timezone
  );

  const now = new Date();

  // Format time in the target timezone
  const timeStr = formatInTimeZone(date, timezone, 'h:mm a');
  const dayOfWeek = formatInTimeZone(date, timezone, 'EEEE');

  // Calculate day difference considering timezone
  const dateInTz = toZonedTime(date, timezone);
  const nowInTz = toZonedTime(now, timezone);
  const daysDiff = differenceInDays(startOfDay(dateInTz), startOfDay(nowInTz));

  // Build relative string manually
  debug.timing('Days difference: %d', daysDiff);

  let formatted: string;

  if (daysDiff === 0) {
    formatted = `today at ${timeStr}`;
  } else if (daysDiff === -1) {
    formatted = `yesterday at ${timeStr}`;
  } else if (daysDiff === 1) {
    formatted = `tomorrow at ${timeStr}`;
  } else if (daysDiff >= -6 && daysDiff <= -2) {
    // This week, past
    formatted = `last ${dayOfWeek} at ${timeStr}`;
  } else if (daysDiff >= 2 && daysDiff <= 6) {
    // This week, future
    formatted = `${dayOfWeek} at ${timeStr}`;
  } else {
    // Beyond a week, show date
    const dateStr = formatInTimeZone(date, timezone, 'MM/dd/yyyy');
    formatted = `${dateStr} at ${timeStr}`;
  }

  debug.timing('Formatted as: %s', formatted);
  return formatted;
}

/**
 * Format time with custom format string
 * Extracted to isolate custom format logic
 */
export function formatCustomTime(date: Date, customFormat: string, timezone: string): string {
  debug.timing('formatCustomTime called with format: %s, timezone: %s', customFormat, timezone);
  debug.validation('Validating format string for security');

  // Validate format string for security
  if (!isValidFormatString(customFormat)) {
    debug.error('Invalid custom format string: %s', customFormat);
    throw new ValidationError('Invalid custom format string', {
      custom_format: customFormat,
      reason: 'Format string contains invalid characters',
    });
  }

  debug.timing('Formatting with: %s', customFormat);
  // Always use formatInTimeZone for consistency
  const formatted = formatInTimeZone(date, timezone, customFormat);

  debug.timing('Custom formatted result: %s', formatted);
  return formatted;
}

/**
 * Main formatTime function with reduced complexity
 * Orchestrates the formatting process using extracted helpers
 */
export function formatTime(params: FormatTimeParams): FormatTimeResult {
  debug.timing('formatTime called with params: %O', params);

  // Validate parameters first
  validateFormatParams(params);

  const formatType = params.format.toLowerCase();
  const config = getConfig();
  const timezone = resolveTimezone(params.timezone, config.defaultTimezone);

  // Use withCache wrapper
  return withCache(
    `format_time_${params.time}_${formatType}_${params.custom_format ?? ''}_${timezone}`,
    CacheTTL.TIMEZONE_CONVERT,
    () => {
      // Parse the time input
      const date = parseTimeWithFallback(params.time, timezone);

      let formatted: string;

      // Format based on type - now much simpler!
      switch (formatType) {
        case 'relative':
        case 'calendar':
          formatted = formatRelativeTime(date, timezone);
          break;

        case 'custom':
          // We know custom_format exists due to validation
          formatted = formatCustomTime(date, params.custom_format as string, timezone);
          break;

        default:
          // Should never reach here due to validation
          debug.error('Invalid format type (should never reach): %s', formatType);
          throw new ValidationError('Invalid format type', { format: formatType });
      }

      const result: FormatTimeResult = {
        formatted,
        original: date.toISOString(),
      };

      debug.timing('formatTime returning: %O', result);
      return result;
    }
  );
}
