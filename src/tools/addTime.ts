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
import { cache, CacheTTL } from '../cache/timeCache';
import { validateTimezone, createError } from '../utils/validation';
import { getConfig } from '../utils/config';
import { TimeServerErrorCodes } from '../types';
import type { AddTimeParams, AddTimeResult } from '../types';

const unitFunctions = {
  years: addYears,
  months: addMonths,
  days: addDays,
  hours: addHours,
  minutes: addMinutes,
  seconds: addSeconds,
};

export function addTime(params: AddTimeParams): AddTimeResult {
  const { time, amount, unit } = params;
  const config = getConfig();
  const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);

  // Generate cache key
  const cacheKey = `add_${time}_${amount}_${unit}_${timezone}`;

  // Check cache
  const cached = cache.get<AddTimeResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Validate unit
  if (!unitFunctions[unit]) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_PARAMETER,
        `Invalid unit: ${unit}. Must be one of: years, months, days, hours, minutes, seconds`,
        { unit },
      ),
    };
  }

  // Validate amount
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_PARAMETER,
        `Invalid amount: ${amount}. Must be a finite number`,
        { amount },
      ),
    };
  }

  // Validate timezone if provided
  if (params.timezone && !validateTimezone(timezone)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_TIMEZONE, `Invalid timezone: ${timezone}`, {
        timezone,
      }),
    };
  }

  let inputDate: Date;
  let displayTimezone = timezone;
  let hasExplicitOffset = false;
  let explicitOffset = '';

  try {
    // Handle different input formats
    if (/^\d+$/.test(time)) {
      // Unix timestamp
      const timestamp = parseInt(time, 10);
      if (isNaN(timestamp)) {
        throw new Error('Invalid Unix timestamp');
      }
      inputDate = new Date(timestamp * 1000);
      // Unix timestamps are always UTC, but display in requested timezone if specified
      if (!params.timezone) {
        displayTimezone = 'UTC';
      }
    } else {
      // Check if the input has timezone information
      if (time.includes('Z')) {
        // Has Z suffix, it's UTC
        inputDate = parseISO(time);
        // Don't override displayTimezone if timezone was requested
        if (!params.timezone) {
          displayTimezone = 'UTC';
        }
      } else if (/[+-]\d{2}:\d{2}/.test(time)) {
        // Has explicit offset
        inputDate = parseISO(time);
        hasExplicitOffset = true;
        const offsetResult = time.match(/([+-]\d{2}:\d{2})$/);
        explicitOffset = offsetResult ? offsetResult[0] : '';
        // Don't override displayTimezone if we have explicit offset
      } else {
        // No timezone info, treat as being in the specified timezone
        inputDate = toDate(time, { timeZone: timezone });
      }
    }

    if (!isValid(inputDate)) {
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

  // Perform the addition
  const addFunction = unitFunctions[unit];
  const resultDate = addFunction(inputDate, amount);

  // Format the original and result times
  let original: string;
  let result: string;

  if (/^\d+$/.test(time)) {
    // Unix timestamp - always display as UTC unless timezone is specified
    if (params.timezone) {
      original = formatInTimeZone(inputDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
      result = formatInTimeZone(resultDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
    } else {
      original = inputDate.toISOString();
      result = resultDate.toISOString();
    }
  } else if (time.includes('Z') && params.timezone) {
    // Z suffix but timezone requested - display in requested timezone
    original = formatInTimeZone(inputDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
    result = formatInTimeZone(resultDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
  } else if (time.includes('Z')) {
    // Z suffix and no timezone requested - display as UTC
    original = inputDate.toISOString();
    result = resultDate.toISOString();
  } else if (hasExplicitOffset) {
    // Has explicit offset - preserve it
    original = time.includes('.') ? time : time.replace(explicitOffset, '.000' + explicitOffset);

    // For the result, we need to format it at the same offset
    // The tricky part is that date-fns operations happen in UTC, so we need to
    // find what local time would be at that offset

    // Parse the offset to get hours and minutes
    const offsetMatch = explicitOffset.match(/([+-])(\d{2}):(\d{2})/);
    if (offsetMatch) {
      const sign = offsetMatch[1] === '+' ? 1 : -1;
      const hours = parseInt(offsetMatch[2], 10);
      const minutes = parseInt(offsetMatch[3], 10);
      const offsetMinutes = sign * (hours * 60 + minutes);

      // Create a date adjusted for the offset to get the local time
      const resultLocal = new Date(resultDate.getTime() + offsetMinutes * 60 * 1000);
      const resultTimeStr = resultLocal.toISOString().substring(0, 19);
      result = resultTimeStr + '.000' + explicitOffset;
    } else {
      // Fallback if offset parsing fails
      result = formatInTimeZone(resultDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS") + explicitOffset;
    }
  } else {
    // No timezone info - display in specified timezone
    original = formatInTimeZone(inputDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
    result = formatInTimeZone(resultDate, displayTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
  }

  const output: AddTimeResult = {
    original,
    result,
    unix_original: Math.floor(inputDate.getTime() / 1000),
    unix_result: Math.floor(resultDate.getTime() / 1000),
  };

  // Cache the result
  cache.set(cacheKey, output, CacheTTL.CALCULATIONS);

  return output;
}
