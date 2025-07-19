import { parseISO, isValid, startOfDay, differenceInDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { cache, CacheTTL } from '../cache/timeCache';
import { validateTimezone, createError } from '../utils/validation';
import { getConfig } from '../utils/config';
import { TimeServerErrorCodes } from '../types';
import type { FormatTimeParams, FormatTimeResult } from '../types';

export function formatTime(params: FormatTimeParams): FormatTimeResult {
  const formatType = params.format.toLowerCase();
  const config = getConfig();
  const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);

  // Generate cache key - use effective timezone
  const cacheKey = `format_time_${params.time}_${formatType}_${params.custom_format ?? ''}_${timezone}`;

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
