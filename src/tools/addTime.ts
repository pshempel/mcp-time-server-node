import {
  addYears,
  addMonths,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
  parseISO,
  isValid,
} from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';

import { hashCacheKey } from '../cache/cacheKeyHash';
import { cache, CacheTTL } from '../cache/timeCache';
import { TimeServerErrorCodes } from '../types';
import type { AddTimeParams, AddTimeResult } from '../types';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { validateTimezone, createError, validateDateInput } from '../utils/validation';

const unitFunctions = {
  years: addYears,
  months: addMonths,
  days: addDays,
  hours: addHours,
  minutes: addMinutes,
  seconds: addSeconds,
};

/**
 * Validates that the unit is one of the allowed time units
 */
export function validateUnit(unit: string): void {
  debug.tools('validateUnit called with: unit=%s', unit);

  if (!Object.prototype.hasOwnProperty.call(unitFunctions, unit)) {
    debug.tools('Invalid unit: %s', unit);
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_PARAMETER,
        `Invalid unit: ${unit}. Must be one of: years, months, days, hours, minutes, seconds`,
        { unit }
      ),
    };
  }

  debug.tools('Unit validation passed');
}

/**
 * Validates that the amount is a finite number
 */
export function validateAmount(amount: number): void {
  debug.tools('validateAmount called with: amount=%s', amount);

  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    debug.tools('Invalid amount: %s', amount);
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_PARAMETER,
        `Invalid amount: ${amount}. Must be a finite number`,
        { amount }
      ),
    };
  }

  debug.tools('Amount validation passed');
}

interface ParseDateResult {
  date: Date;
  displayTimezone: string;
  hasExplicitOffset: boolean;
  explicitOffset: string;
}

interface FormatResult extends AddTimeResult {
  original: string;
  result: string;
  unix_original: number;
  unix_result: number;
}

interface ISOParseResult {
  date: Date;
  hasZ: boolean;
  hasOffset: boolean;
  offset: string;
}

/**
 * Parses a Unix timestamp string into a Date object
 * @param time - The potential Unix timestamp string
 * @returns Date object if valid Unix timestamp, null otherwise
 */
export function parseUnixTimestamp(time: string): Date | null {
  debug.tools('parseUnixTimestamp called with: %s', time);

  if (!/^\d+$/.test(time)) {
    debug.tools('Not a pure numeric string');
    return null;
  }

  const timestamp = parseInt(time, 10);
  if (isNaN(timestamp)) {
    debug.tools('Failed to parse as number');
    return null;
  }

  const date = new Date(timestamp * 1000);
  debug.tools('Parsed Unix timestamp: %s', date.toISOString());
  return date;
}

/**
 * Parses ISO string and extracts timezone information
 * @param time - ISO format time string
 * @returns Parsed date with timezone info
 * @throws Error if date is invalid
 */
export function parseISOWithTimezoneInfo(time: string): ISOParseResult {
  debug.tools('parseISOWithTimezoneInfo called with: %s', time);

  const date = parseISO(time);

  if (!isValid(date)) {
    debug.tools('Invalid date parsed from: %s', time);
    throw new Error('Invalid date');
  }

  const hasZ = time.includes('Z');
  const offsetMatch = time.match(/([+-]\d{2}:\d{2})$/);
  const hasOffset = !!offsetMatch;
  const offset = offsetMatch ? offsetMatch[0] : '';

  const result: ISOParseResult = {
    date,
    hasZ,
    hasOffset,
    offset,
  };

  debug.tools('parseISOWithTimezoneInfo result: %O', result);
  return result;
}

/**
 * Parses a time string as local time in the specified timezone
 * @param time - Time string to parse
 * @param timezone - Timezone to interpret the time in
 * @returns Parsed date
 * @throws Error if the date is invalid
 */
function parseLocalTimeInTimezone(time: string, timezone: string): Date {
  debug.tools('Parsing as local time in timezone: %s', timezone);
  const date = toDate(time, { timeZone: timezone });

  if (!isValid(date)) {
    throw new Error('Invalid date');
  }

  return date;
}

/**
 * Creates a ParseDateResult object
 * @param date - The parsed date
 * @param displayTimezone - Timezone for display
 * @param hasExplicitOffset - Whether input had explicit offset
 * @param explicitOffset - The explicit offset if any
 * @returns ParseDateResult object
 */
function createParseResult(
  date: Date,
  displayTimezone: string,
  hasExplicitOffset = false,
  explicitOffset = ''
): ParseDateResult {
  return {
    date,
    displayTimezone,
    hasExplicitOffset,
    explicitOffset,
  };
}

/**
 * Parses date input with timezone awareness
 */
export function parseDateWithTimezone(
  time: string,
  timezone: string,
  paramTimezone?: string
): ParseDateResult {
  debug.tools(
    'parseDateWithTimezone called with: time=%s, timezone=%s, paramTimezone=%s',
    time,
    timezone,
    paramTimezone
  );

  try {
    // Try parsing as Unix timestamp first
    const unixDate = parseUnixTimestamp(time);
    if (unixDate) {
      return createParseResult(unixDate, !paramTimezone ? 'UTC' : timezone);
    }

    // Try parsing as ISO with timezone info
    try {
      const isoResult = parseISOWithTimezoneInfo(time);

      // Handle different ISO formats
      if (isoResult.hasZ && !paramTimezone) {
        return createParseResult(isoResult.date, 'UTC');
      } else if (isoResult.hasOffset) {
        return createParseResult(isoResult.date, timezone, true, isoResult.offset);
      } else {
        // ISO string without timezone info - parse in specified timezone
        const date = parseLocalTimeInTimezone(time, timezone);
        return createParseResult(date, timezone);
      }
    } catch {
      // Not a valid ISO format, parse as local time
      const date = parseLocalTimeInTimezone(time, timezone);
      return createParseResult(date, timezone);
    }
  } catch (error) {
    debug.tools('Parse error: %s', error);
    throw {
      error: createError(TimeServerErrorCodes.INVALID_DATE_FORMAT, `Invalid time format: ${time}`, {
        time,
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}

/**
 * Formats the result of the add time operation
 */
export function formatAddTimeResult(
  inputDate: Date,
  resultDate: Date,
  time: string,
  params: AddTimeParams,
  parseInfo: ParseDateResult
): FormatResult {
  debug.tools('formatAddTimeResult called with dates and parseInfo: %O', parseInfo);

  const { displayTimezone, hasExplicitOffset, explicitOffset } = parseInfo;

  // Handle Unix timestamp formatting
  if (/^\d+$/.test(time)) {
    return formatUnixTimestampResult(inputDate, resultDate, params.timezone ?? undefined);
  }

  // Handle explicit offset formatting
  if (hasExplicitOffset) {
    return formatWithExplicitOffset(inputDate, resultDate, time, explicitOffset);
  }

  // Handle Z suffix with timezone override
  if (time.includes('Z') && params.timezone) {
    debug.tools('Formatting Z suffix with requested timezone: %s', displayTimezone);
    return {
      original: formatInTimeZone(inputDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
      result: formatInTimeZone(resultDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
      unix_original: Math.floor(inputDate.getTime() / 1000),
      unix_result: Math.floor(resultDate.getTime() / 1000),
    };
  }

  // Handle Z suffix without timezone override (UTC)
  if (time.includes('Z')) {
    debug.tools('Formatting Z suffix as UTC');
    return {
      original: inputDate.toISOString(),
      result: resultDate.toISOString(),
      unix_original: Math.floor(inputDate.getTime() / 1000),
      unix_result: Math.floor(resultDate.getTime() / 1000),
    };
  }

  // Default formatting with specified timezone
  debug.tools('Formatting in timezone: %s', displayTimezone);
  return {
    original: formatInTimeZone(inputDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
    result: formatInTimeZone(resultDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
    unix_original: Math.floor(inputDate.getTime() / 1000),
    unix_result: Math.floor(resultDate.getTime() / 1000),
  };
}

/**
 * Formats Unix timestamp results with optional timezone
 * @param inputDate - Original date
 * @param resultDate - Result date after time operation
 * @param timezone - Optional timezone for display
 * @returns Formatted result with Unix timestamps
 */
export function formatUnixTimestampResult(
  inputDate: Date,
  resultDate: Date,
  timezone?: string
): FormatResult {
  debug.tools(
    'formatUnixTimestampResult called with: inputDate=%s, resultDate=%s, timezone=%s',
    inputDate.toISOString(),
    resultDate.toISOString(),
    timezone
  );

  let original: string;
  let result: string;

  if (timezone) {
    original = formatInTimeZone(inputDate, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
    result = formatInTimeZone(resultDate, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
  } else {
    original = inputDate.toISOString();
    result = resultDate.toISOString();
  }

  const output: FormatResult = {
    original,
    result,
    unix_original: Math.floor(inputDate.getTime() / 1000),
    unix_result: Math.floor(resultDate.getTime() / 1000),
  };

  debug.tools('formatUnixTimestampResult returning: %O', output);
  return output;
}

/**
 * Formats result preserving explicit timezone offset
 * @param inputDate - Original date
 * @param resultDate - Result date after time operation
 * @param originalTime - Original time string with offset
 * @param offset - The timezone offset to preserve
 * @returns Formatted result with preserved offset
 */
export function formatWithExplicitOffset(
  inputDate: Date,
  resultDate: Date,
  originalTime: string,
  offset: string
): FormatResult {
  debug.tools(
    'formatWithExplicitOffset called with: originalTime=%s, offset=%s',
    originalTime,
    offset
  );

  // Format original - add milliseconds if missing
  const original = originalTime.includes('.')
    ? originalTime
    : originalTime.replace(offset, '.000' + offset);

  // Parse the offset to calculate the result
  const offsetMatch = offset.match(/([+-])(\d{2}):(\d{2})/);
  if (!offsetMatch) {
    throw new Error(`Invalid offset format: ${offset}`);
  }

  const sign = offsetMatch[1] === '+' ? 1 : -1;
  const hours = parseInt(offsetMatch[2], 10);
  const minutes = parseInt(offsetMatch[3], 10);
  const offsetMinutes = sign * (hours * 60 + minutes);

  // Create a date adjusted for the offset to get the local time
  const resultLocal = new Date(resultDate.getTime() + offsetMinutes * 60 * 1000);
  const resultTimeStr = resultLocal.toISOString().substring(0, 19);
  const result = resultTimeStr + '.000' + offset;

  const output: FormatResult = {
    original,
    result,
    unix_original: Math.floor(inputDate.getTime() / 1000),
    unix_result: Math.floor(resultDate.getTime() / 1000),
  };

  debug.tools('formatWithExplicitOffset returning: %O', output);
  return output;
}

export function addTime(params: AddTimeParams): AddTimeResult {
  debug.tools('addTime called with params: %O', params);
  const { time, amount, unit } = params;

  // Validate date input with strict type checking
  validateDateInput(time, 'time');

  const config = getConfig();
  const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);

  // Generate cache key
  const rawCacheKey = `add_${time}_${amount}_${unit}_${timezone}`;
  const cacheKey = hashCacheKey(rawCacheKey);

  // Check cache
  const cached = cache.get<AddTimeResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Validate unit
  validateUnit(unit);

  // Validate amount
  validateAmount(amount);

  // Validate timezone if provided
  if (params.timezone && !validateTimezone(timezone)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_TIMEZONE, `Invalid timezone: ${timezone}`, {
        timezone,
      }),
    };
  }

  // Parse the input date with timezone handling
  const parseResult = parseDateWithTimezone(time, timezone, params.timezone);
  const { date: inputDate } = parseResult;

  // Perform the addition
  // eslint-disable-next-line security/detect-object-injection -- Unit validated earlier
  const addFunction = unitFunctions[unit];
  const resultDate = addFunction(inputDate, amount);

  // Format the result
  const output = formatAddTimeResult(inputDate, resultDate, time, params, parseResult);

  // Cache the result
  cache.set(cacheKey, output, CacheTTL.CALCULATIONS);

  debug.tools('addTime returning: %O', output);
  return output;
}
