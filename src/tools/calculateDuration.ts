import { differenceInMilliseconds, parseISO, isValid } from 'date-fns';
import { toDate } from 'date-fns-tz';

import { hashCacheKey } from '../cache/cacheKeyHash';
import { cache, CacheTTL } from '../cache/timeCache';
import { TimeServerErrorCodes } from '../types';
import type { CalculateDurationParams, CalculateDurationResult } from '../types';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { validateTimezone, createError, validateDateString } from '../utils/validation';

const validUnits = ['auto', 'milliseconds', 'seconds', 'minutes', 'hours', 'days'];

export function calculateDuration(params: CalculateDurationParams): CalculateDurationResult {
  debug.tools('calculateDuration called with params: %O', params);
  const { start_time, end_time } = params;

  // Validate string lengths first
  if (typeof start_time === 'string') {
    validateDateString(start_time, 'start_time');
  }
  if (typeof end_time === 'string') {
    validateDateString(end_time, 'end_time');
  }

  const config = getConfig();
  const unit = validateUnit(params.unit);
  const timezone = resolveTimezone(params.timezone, config.defaultTimezone);

  // Generate cache key
  const rawCacheKey = `duration_${start_time}_${end_time}_${unit}_${timezone}`;
  debug.tools('Cache key (raw): %s', rawCacheKey);
  const cacheKey = hashCacheKey(rawCacheKey);

  // Check cache
  const cached = cache.get<CalculateDurationResult>(cacheKey);
  if (cached) {
    debug.tools('Returning cached result');
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

  // Parse dates with proper error context
  const startDate = parseDateWithContext(start_time, timezone, 'start_time');
  debug.tools('Parsed start date: %s', startDate.toISOString());

  const endDate = parseDateWithContext(end_time, timezone, 'end_time');
  debug.tools('Parsed end date: %s', endDate.toISOString());

  // Calculate all duration values
  const values = calculateDurationValues(startDate, endDate);
  debug.tools('Duration in milliseconds: %d', values.milliseconds);

  // Format the result
  const formatted = formatDurationResult(values, unit);
  debug.tools('Formatted duration: %s', formatted);

  const result: CalculateDurationResult = {
    ...values,
    formatted,
  };

  // Cache the result
  cache.set(cacheKey, result, CacheTTL.CALCULATIONS);
  debug.tools('Result cached with TTL: %d', CacheTTL.CALCULATIONS);

  debug.tools('Returning result: %O', result);
  return result;
}

/**
 * Time components for duration formatting
 */
interface TimeComponents {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Pluralize a time unit based on value
 */
export function pluralize(value: number, singular: string): string {
  return `${value} ${value === 1 ? singular : singular + 's'}`;
}

/**
 * Add a time unit to the parts array if value > 0
 */
export function addTimeUnit(parts: string[], value: number, unit: string): void {
  if (value > 0) {
    parts.push(pluralize(value, unit));
  }
}

/**
 * Calculate time components from total seconds
 */
export function calculateTimeComponents(totalSeconds: number): TimeComponents {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

/**
 * Validate and resolve unit parameter
 */
export function validateUnit(unit: string | undefined): string {
  debug.tools('validateUnit called with: %s', unit);
  const resolved = unit ?? 'auto';

  if (!validUnits.includes(resolved)) {
    debug.tools('Invalid unit detected: %s', resolved);
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_PARAMETER,
        `Invalid unit: ${resolved}. Must be one of: ${validUnits.join(', ')}`,
        { unit: resolved }
      ),
    };
  }

  debug.tools('Resolved unit: %s', resolved);
  return resolved;
}

/**
 * Resolve timezone with empty string handling
 */
export function resolveTimezone(timezone: string | undefined, defaultTimezone: string): string {
  debug.tools('resolveTimezone called with: timezone=%s, default=%s', timezone, defaultTimezone);

  // Empty string explicitly means UTC (Unix convention)
  if (timezone === '') {
    debug.tools('Empty string timezone -> UTC');
    return 'UTC';
  }

  // Undefined/missing means system timezone (LLM friendly)
  const resolved = timezone ?? defaultTimezone;
  debug.tools('Resolved timezone: %s', resolved);
  return resolved;
}

/**
 * Parse date with proper error context
 */
function parseDateWithContext(time: string, timezone: string, paramName: string): Date {
  debug.tools(
    'parseDateWithContext called for %s: time=%s, timezone=%s',
    paramName,
    time,
    timezone
  );

  try {
    const result = parseTimeParameter(time, timezone);
    debug.tools('%s parsed successfully: %s', paramName, result.toISOString());
    return result;
  } catch (error) {
    debug.tools('Failed to parse %s: %s', paramName, error);
    const errorDetails = error as { error?: { details?: { time?: string } } };
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid ${paramName} format: ${time}`,
        { [paramName]: time, error: errorDetails.error?.details?.time ?? time }
      ),
    };
  }
}

/**
 * Parse time parameter with timezone awareness
 */
export function parseTimeParameter(time: string, timezone: string): Date {
  debug.tools('parseTimeParameter called with: time=%s, timezone=%s', time, timezone);

  let result: Date;

  try {
    // Check if it's a Unix timestamp (all digits)
    if (/^\d+$/.test(time)) {
      debug.tools('Parsing as Unix timestamp');
      const timestamp = parseInt(time, 10);
      if (isNaN(timestamp)) {
        throw new Error('Invalid Unix timestamp');
      }
      result = new Date(timestamp * 1000);
      debug.tools('Unix timestamp parsed: %s', result.toISOString());
    } else if (timezone && !time.includes('Z') && !/[+-]\d{2}:\d{2}/.test(time)) {
      // Check if it needs timezone-aware parsing (no Z, no offset)
      debug.tools('Parsing as local time with timezone: %s', timezone);
      result = toDate(time, { timeZone: timezone });
      debug.tools('Local time parsed: %s', result.toISOString());
    } else {
      // Default to parseISO for ISO strings or strings with timezone info
      debug.tools('Parsing as ISO string');
      result = parseISO(time);
      debug.tools('ISO string parsed: %s', result.toISOString());
    }

    // Validate the parsed date
    if (!isValid(result)) {
      debug.tools('Parsed date is invalid');
      throw new Error('Invalid date');
    }

    return result;
  } catch (error) {
    debug.tools('Parse error: %s', error);
    throw {
      error: createError(TimeServerErrorCodes.INVALID_DATE_FORMAT, `Invalid date format: ${time}`, {
        time,
        timezone,
      }),
    };
  }
}

/**
 * Duration values interface
 */
interface DurationValues {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  is_negative: boolean;
}

/**
 * Calculate all duration values from start and end dates
 */
export function calculateDurationValues(startDate: Date, endDate: Date): DurationValues {
  debug.tools(
    'calculateDurationValues called with: start=%s, end=%s',
    startDate.toISOString(),
    endDate.toISOString()
  );

  const milliseconds = differenceInMilliseconds(endDate, startDate);
  const seconds = milliseconds / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const is_negative = milliseconds < 0;

  const result = {
    milliseconds,
    seconds,
    minutes,
    hours,
    days,
    is_negative,
  };

  debug.tools('Calculated duration values: %O', result);
  return result;
}

/**
 * Format duration result based on unit parameter
 */
export function formatDurationResult(values: DurationValues, unit: string): string {
  debug.tools('formatDurationResult called with: unit=%s, values=%O', unit, values);

  let formatted: string;

  if (unit !== 'auto' && unit !== 'milliseconds') {
    // Specific unit requested
    const value =
      unit === 'seconds'
        ? values.seconds
        : unit === 'minutes'
          ? values.minutes
          : unit === 'hours'
            ? values.hours
            : values.days;
    formatted = `${value} ${unit}`;
  } else if (unit === 'milliseconds') {
    formatted = `${values.milliseconds} milliseconds`;
  } else {
    // Auto format - use existing formatDuration helper
    formatted = formatDuration(values.milliseconds);
  }

  debug.tools('Formatted result: %s', formatted);
  return formatted;
}

/**
 * Format duration in human-readable format
 */
function formatDuration(milliseconds: number): string {
  debug.tools('formatDuration called with: %d ms', milliseconds);
  const abs = Math.abs(milliseconds);
  const negative = milliseconds < 0;

  if (abs === 0) {
    debug.tools('Zero duration, returning "0 seconds"');
    return '0 seconds';
  }

  const totalSeconds = Math.floor(abs / 1000);
  const components = calculateTimeComponents(totalSeconds);
  debug.tools('Time components: %O', components);

  const parts: string[] = [];
  addTimeUnit(parts, components.days, 'day');
  addTimeUnit(parts, components.hours, 'hour');
  addTimeUnit(parts, components.minutes, 'minute');
  // Always include seconds if no other units
  if (components.seconds > 0 || parts.length === 0) {
    parts.push(pluralize(components.seconds, 'second'));
  }

  const formatted = parts.join(' ');
  const result = negative ? `-${formatted}` : formatted;
  debug.tools('Formatted duration: %s', result);
  return result;
}
