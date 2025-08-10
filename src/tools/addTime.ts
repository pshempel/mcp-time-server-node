import { addYears, addMonths, addDays, addHours, addMinutes, addSeconds } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { CacheTTL } from '../cache/timeCache';
import type { AddTimeParams, AddTimeResult } from '../types';

// SDK 1.17.2 export issue workaround
const path = require('path');
const sdkPath = path.resolve(__dirname, '../../node_modules/@modelcontextprotocol/sdk/dist/cjs/types');
const { ErrorCode } = require(sdkPath);
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { parseTimeInput } from '../utils/parseTimeInput';
import { resolveTimezone } from '../utils/timezoneUtils';
import { validateTimezone, validateDateInput } from '../utils/validation';
import { withCache } from '../utils/withCache';

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
  debug.validation('validateUnit called with: unit=%s', unit);

  if (!Object.prototype.hasOwnProperty.call(unitFunctions, unit)) {
    debug.validation('Invalid unit: %s', unit);
    debug.error('Invalid unit: %s', unit);
    const err: any = new Error(`Invalid unit: ${unit}. Must be one of: years, months, days, hours, minutes, seconds`);
    err.code = ErrorCode.InvalidParams;
    err.data = { unit };
    throw err;
  }

  debug.validation('Unit validation passed');
}

/**
 * Validates that the amount is a finite number
 */
export function validateAmount(amount: number): void {
  debug.validation('validateAmount called with: amount=%s', amount);

  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    debug.validation('Invalid amount: %s', amount);
    debug.error('Invalid amount: %s', amount);
    const err: any = new Error(`Invalid amount: ${amount}. Must be a finite number`);
    err.code = ErrorCode.InvalidParams;
    err.data = { amount };
    throw err;
  }

  debug.validation('Amount validation passed');
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

/**
 * Parses date input with timezone awareness using the centralized parser
 */
export function parseDateWithTimezone(
  time: string,
  timezone: string,
  paramTimezone?: string
): ParseDateResult {
  debug.parse(
    'parseDateWithTimezone called with: time=%s, timezone=%s, paramTimezone=%s',
    time,
    timezone,
    paramTimezone
  );

  try {
    // Use centralized parser
    const result = parseTimeInput(time, timezone);

    // Determine display timezone based on the parse result
    let displayTimezone = timezone;
    let hasExplicitOffset = false;
    let explicitOffset = '';

    // Check if it was a Unix timestamp (detected as UTC with no explicit timezone)
    if (/^\d+$/.test(time) && !paramTimezone) {
      displayTimezone = 'UTC';
    }

    // Check for explicit timezone offset in the original string
    const offsetMatch = time.match(/([+-]\d{2}:\d{2})$/);
    if (offsetMatch) {
      hasExplicitOffset = true;
      explicitOffset = offsetMatch[0];
    }

    // Handle Z suffix
    if (time.includes('Z') && !paramTimezone) {
      displayTimezone = 'UTC';
    }

    return {
      date: result.date,
      displayTimezone,
      hasExplicitOffset,
      explicitOffset,
    };
  } catch (error) {
    debug.parse('Parse error: %s', error);
    debug.error('Invalid time format: %s, error: %O', time, error);
    const err: any = new Error(`Invalid time format: ${time}`);
    err.code = ErrorCode.InvalidParams;
    err.data = {
      time,
      error: error instanceof Error ? error.message : String(error),
    };
    throw err;
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
  debug.timing('formatAddTimeResult called with dates and parseInfo: %O', parseInfo);

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
    debug.timing('Formatting Z suffix with requested timezone: %s', displayTimezone);
    return {
      original: formatInTimeZone(inputDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
      result: formatInTimeZone(resultDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
      unix_original: Math.floor(inputDate.getTime() / 1000),
      unix_result: Math.floor(resultDate.getTime() / 1000),
    };
  }

  // Handle Z suffix without timezone override (UTC)
  if (time.includes('Z')) {
    debug.timing('Formatting Z suffix as UTC');
    return {
      original: inputDate.toISOString(),
      result: resultDate.toISOString(),
      unix_original: Math.floor(inputDate.getTime() / 1000),
      unix_result: Math.floor(resultDate.getTime() / 1000),
    };
  }

  // Default formatting with specified timezone
  debug.timing('Formatting in timezone: %s', displayTimezone);
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
  debug.timing(
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

  debug.timing('formatUnixTimestampResult returning: %O', output);
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
  debug.timing(
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
    debug.error('Invalid offset format: %s', offset);
    const err: any = new Error(`Invalid offset format: ${offset}`);
    err.code = ErrorCode.InvalidParams;
    err.data = { offset };
    throw err;
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

  debug.timing('formatWithExplicitOffset returning: %O', output);
  return output;
}

export function addTime(params: AddTimeParams): AddTimeResult {
  debug.timing('addTime called with params: %O', params);
  const { time, amount, unit } = params;

  // Validate date input with strict type checking
  validateDateInput(time, 'time');

  const config = getConfig();
  const timezone = resolveTimezone(params.timezone, config.defaultTimezone);

  // Use withCache wrapper instead of manual cache management
  return withCache(`add_${time}_${amount}_${unit}_${timezone}`, CacheTTL.CALCULATIONS, () => {
    // Validate unit
    validateUnit(unit);

    // Validate amount
    validateAmount(amount);

    // Validate timezone if provided
    if (params.timezone && !validateTimezone(timezone)) {
      debug.error('Invalid timezone: %s', timezone);
      const err: any = new Error(`Invalid timezone: ${timezone}`);
      err.code = ErrorCode.InvalidParams;
      err.data = { timezone };
      throw err;
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

    debug.timing('addTime returning: %O', output);
    return output;
  });
}
