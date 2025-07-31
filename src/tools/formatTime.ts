import { parseISO, isValid, startOfDay, differenceInDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

import { hashCacheKey } from '../cache/cacheKeyHash';
import { cache, CacheTTL } from '../cache/timeCache';
import { TimeServerErrorCodes } from '../types';
import type { FormatTimeParams, FormatTimeResult } from '../types';
import { getConfig } from '../utils/config';
import {
  validateTimezone,
  createError,
  validateDateString,
  validateStringLength,
  LIMITS,
} from '../utils/validation';

/**
 * Validates that a format string only contains safe date-fns format tokens
 * @param format - The format string to validate
 * @returns true if valid, false otherwise
 */
function isValidFormatString(format: string): boolean {
  // Allow only date-fns format tokens and safe literals
  // Based on https://date-fns.org/v4.1.0/docs/format
  const validTokens = [
    // Era
    'G',
    'GG',
    'GGG',
    'GGGG',
    'GGGGG',
    // Year
    'y',
    'yo',
    'yy',
    'yyy',
    'yyyy',
    'yyyyy',
    // Local week-numbering year
    'Y',
    'Yo',
    'YY',
    'YYY',
    'YYYY',
    'YYYYY',
    // ISO week-numbering year
    'R',
    'RR',
    'RRR',
    'RRRR',
    'RRRRR',
    // Extended year
    'u',
    'uu',
    'uuu',
    'uuuu',
    'uuuuu',
    // Quarter
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
    // Month
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
    // Local week of year
    'w',
    'wo',
    'ww',
    // ISO week of year
    'I',
    'Io',
    'II',
    // Day of month
    'd',
    'do',
    'dd',
    // Day of year
    'D',
    'Do',
    'DD',
    'DDD',
    // Day of week
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
    // Local day of week
    // AM/PM
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
    // Hour
    'h',
    'ho',
    'hh',
    'H',
    'Ho',
    'HH',
    'K',
    'Ko',
    'KK',
    'k',
    'ko',
    'kk',
    // Minute
    'm',
    'mo',
    'mm',
    // Second
    's',
    'so',
    'ss',
    // Fraction of second
    'S',
    'SS',
    'SSS',
    // Timezone
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
    // Unix timestamp
    't',
    'T',
  ];

  // Pattern to match format tokens and escaped content
  // Allows: format tokens, single quotes for escaping, spaces, punctuation
  // eslint-disable-next-line security/detect-non-literal-regexp -- Building from known safe tokens
  const tokenPattern = new RegExp(`^(?:${validTokens.join('|')}|'[^']*'|[\\s\\-:.,/()\\[\\]])+$`);

  // Check for dangerous characters that should never appear
  const dangerousChars = /[;&|`$<>{}\\]/;
  if (dangerousChars.test(format)) {
    return false;
  }

  // Check if format string matches allowed pattern
  return tokenPattern.test(format);
}

export function formatTime(params: FormatTimeParams): FormatTimeResult {
  // Validate string lengths first
  if (typeof params.time === 'string') {
    validateDateString(params.time, 'time');
  }
  if (params.custom_format) {
    validateStringLength(params.custom_format, LIMITS.MAX_FORMAT_LENGTH, 'custom_format');
  }

  const formatType = params.format.toLowerCase();
  const config = getConfig();
  const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);

  // Generate cache key - use effective timezone
  const rawCacheKey = `format_time_${params.time}_${formatType}_${params.custom_format ?? ''}_${timezone}`;
  const cacheKey = hashCacheKey(rawCacheKey);

  // Check cache
  const cached = cache.get<FormatTimeResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Validate format type
  const validFormats = ['relative', 'calendar', 'custom'];
  if (!validFormats.includes(formatType)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_PARAMETER, 'Invalid format type', {
        format: params.format,
      }),
    };
  }

  // Validate custom format requirements
  if (formatType === 'custom') {
    if (params.custom_format === undefined || params.custom_format === null) {
      throw {
        error: createError(
          TimeServerErrorCodes.INVALID_PARAMETER,
          'custom_format is required when format is "custom"',
          {},
        ),
      };
    }
    if (params.custom_format === '') {
      throw {
        error: createError(
          TimeServerErrorCodes.INVALID_PARAMETER,
          'custom_format cannot be empty',
          {
            custom_format: '',
          },
        ),
      };
    }
  }

  // Validate timezone
  if (!validateTimezone(timezone)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_TIMEZONE, `Invalid timezone: ${timezone}`, {
        timezone,
      }),
    };
  }

  // Parse time
  let date: Date;
  try {
    // Try to parse as number (unix timestamp)
    const timestamp = parseInt(params.time, 10);
    if (!isNaN(timestamp) && timestamp.toString() === params.time) {
      date = new Date(timestamp * 1000);
    } else {
      // First try parseISO for strict parsing
      date = parseISO(params.time);

      // If parseISO returns invalid date, try native Date constructor
      // which handles overflow dates gracefully (e.g., Feb 30 -> Mar 2)
      if (!isValid(date)) {
        date = new Date(params.time);
      }
    }

    if (!isValid(date)) {
      throw new Error('Invalid date');
    }
  } catch (error) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_DATE_FORMAT, 'Invalid time', {
        time: params.time,
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }

  let formatted: string;

  switch (formatType) {
    case 'relative':
    case 'calendar': {
      // formatRelative doesn't support timezones, so we need custom implementation
      const now = new Date();

      // Format time in the target timezone
      const timeStr = formatInTimeZone(date, timezone, 'h:mm a');
      const dayOfWeek = formatInTimeZone(date, timezone, 'EEEE');

      // Calculate day difference considering timezone
      const dateInTz = toZonedTime(date, timezone);
      const nowInTz = toZonedTime(now, timezone);
      const daysDiff = differenceInDays(startOfDay(dateInTz), startOfDay(nowInTz));

      // Build relative string manually
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
      break;
    }

    case 'custom': {
      // We already validated that custom_format exists for custom format type
      const customFormat = params.custom_format as string;

      // Validate format string for security
      if (!isValidFormatString(customFormat)) {
        throw {
          error: createError(
            TimeServerErrorCodes.INVALID_PARAMETER,
            'Invalid custom format string',
            {
              custom_format: customFormat,
              reason: 'Format string contains invalid characters',
            },
          ),
        };
      }

      // Always use formatInTimeZone for consistency
      formatted = formatInTimeZone(date, timezone, customFormat);
      break;
    }

    default:
      // Should never reach here due to validation
      throw {
        error: createError(TimeServerErrorCodes.INVALID_PARAMETER, 'Invalid format type', {
          format: formatType,
        }),
      };
  }

  const result: FormatTimeResult = {
    formatted,
    original: date.toISOString(),
  };

  // Cache for 5 minutes
  cache.set(cacheKey, result, CacheTTL.TIMEZONE_CONVERT);

  return result;
}
