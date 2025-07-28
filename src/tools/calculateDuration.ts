import { differenceInMilliseconds, parseISO, isValid } from 'date-fns';
import { toDate } from 'date-fns-tz';
import { cache, CacheTTL } from '../cache/timeCache';
import { hashCacheKey } from '../cache/cacheKeyHash';
import { validateTimezone, createError, validateDateString } from '../utils/validation';
import { getConfig } from '../utils/config';
import { TimeServerErrorCodes } from '../types';
import type { CalculateDurationParams, CalculateDurationResult } from '../types';

const validUnits = ['auto', 'milliseconds', 'seconds', 'minutes', 'hours', 'days'];

export function calculateDuration(params: CalculateDurationParams): CalculateDurationResult {
  const { start_time, end_time } = params;

  // Validate string lengths first
  if (typeof start_time === 'string') {
    validateDateString(start_time, 'start_time');
  }
  if (typeof end_time === 'string') {
    validateDateString(end_time, 'end_time');
  }

  const unit = params.unit ?? 'auto';
  const config = getConfig();
  const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);

  // Generate cache key
  const rawCacheKey = `duration_${start_time}_${end_time}_${unit}_${timezone}`;
  const cacheKey = hashCacheKey(rawCacheKey);

  // Check cache
  const cached = cache.get<CalculateDurationResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Validate unit if provided
  if (unit && !validUnits.includes(unit)) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_PARAMETER,
        `Invalid unit: ${unit}. Must be one of: ${validUnits.join(', ')}`,
        { unit },
      ),
    };
  }

  // Validate timezone if provided
  if (timezone && !validateTimezone(timezone)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_TIMEZONE, `Invalid timezone: ${timezone}`, {
        timezone,
      }),
    };
  }

  // Parse start time
  let startDate: Date;
  try {
    if (/^\d+$/.test(start_time)) {
      // Unix timestamp
      const timestamp = parseInt(start_time, 10);
      if (isNaN(timestamp)) {
        throw new Error('Invalid Unix timestamp');
      }
      startDate = new Date(timestamp * 1000);
    } else if (timezone && !start_time.includes('Z') && !/[+-]\d{2}:\d{2}/.test(start_time)) {
      // Local time with timezone parameter
      startDate = toDate(start_time, { timeZone: timezone });
    } else {
      // ISO string or has timezone info
      startDate = parseISO(start_time);
    }

    if (!isValid(startDate)) {
      throw new Error('Invalid date');
    }
  } catch (error) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid start_time format: ${start_time}`,
        {
          start_time,
          error: error instanceof Error ? error.message : String(error),
        },
      ),
    };
  }

  // Parse end time
  let endDate: Date;
  try {
    if (/^\d+$/.test(end_time)) {
      // Unix timestamp
      const timestamp = parseInt(end_time, 10);
      if (isNaN(timestamp)) {
        throw new Error('Invalid Unix timestamp');
      }
      endDate = new Date(timestamp * 1000);
    } else if (timezone && !end_time.includes('Z') && !/[+-]\d{2}:\d{2}/.test(end_time)) {
      // Local time with timezone parameter
      endDate = toDate(end_time, { timeZone: timezone });
    } else {
      // ISO string or has timezone info
      endDate = parseISO(end_time);
    }

    if (!isValid(endDate)) {
      throw new Error('Invalid date');
    }
  } catch (error) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid end_time format: ${end_time}`,
        {
          end_time,
          error: error instanceof Error ? error.message : String(error),
        },
      ),
    };
  }

  // Calculate differences
  const milliseconds = differenceInMilliseconds(endDate, startDate);
  const seconds = milliseconds / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const is_negative = milliseconds < 0;

  // Format the duration based on unit parameter
  let formatted: string;
  if (unit !== 'auto' && unit !== 'milliseconds') {
    // Specific unit requested
    const value =
      unit === 'seconds' ? seconds : unit === 'minutes' ? minutes : unit === 'hours' ? hours : days;
    formatted = `${value} ${unit}`;
  } else {
    // Auto format - human readable
    formatted = formatDuration(milliseconds);
  }

  const result: CalculateDurationResult = {
    milliseconds,
    seconds,
    minutes,
    hours,
    days,
    formatted,
    is_negative,
  };

  // Cache the result
  cache.set(cacheKey, result, CacheTTL.CALCULATIONS);

  return result;
}

function formatDuration(milliseconds: number): string {
  const abs = Math.abs(milliseconds);
  const negative = milliseconds < 0;

  if (abs === 0) {
    return '0 seconds';
  }

  const totalSeconds = Math.floor(abs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  const formatted = parts.join(' ');
  return negative ? `-${formatted}` : formatted;
}
