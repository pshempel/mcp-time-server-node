import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setDate,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  getDay,
  getDate,
  differenceInDays,
  isAfter,
  parseISO,
  isValid,
  startOfDay,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { cache, CacheTTL } from '../cache/timeCache';
import { validateTimezone, createError } from '../utils/validation';
import { getConfig } from '../utils/config';
import { TimeServerErrorCodes } from '../types';
import type { NextOccurrenceParams, NextOccurrenceResult } from '../types';

export function nextOccurrence(params: NextOccurrenceParams): NextOccurrenceResult {
  const pattern = params.pattern.toLowerCase();
  const config = getConfig();
  const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);

  // Generate cache key - use effective timezone
  const cacheKey = `next_occurrence_${pattern}_${params.start_from ?? 'now'}_${params.day_of_week ?? ''}_${params.day_of_month ?? ''}_${params.time ?? ''}_${timezone}`;

  // Check cache
  const cached = cache.get<NextOccurrenceResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Validate pattern
  const validPatterns = ['daily', 'weekly', 'monthly', 'yearly'];
  if (!validPatterns.includes(pattern)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_PARAMETER, 'Invalid pattern', {
        pattern: params.pattern,
      }),
    };
  }

  // Validate timezone
  if (!validateTimezone(timezone)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_TIMEZONE, `Invalid timezone: ${timezone}`, {
        timezone,
      }),
    };
  }

  // Parse start_from or use current time
  let startFrom: Date;
  if (params.start_from) {
    try {
      startFrom = parseISO(params.start_from);
      if (!isValid(startFrom)) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      throw {
        error: createError(TimeServerErrorCodes.INVALID_DATE_FORMAT, 'Invalid start_from date', {
          start_from: params.start_from,
          error: error instanceof Error ? error.message : String(error),
        }),
      };
    }
  } else {
    startFrom = new Date();
  }

  // Keep startFrom in UTC for now, we'll handle timezone when setting time

  // Parse time if provided
  let targetHours: number | null = null;
  let targetMinutes: number | null = null;
  if (params.time) {
    const timeMatch = params.time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      throw {
        error: createError(TimeServerErrorCodes.INVALID_PARAMETER, 'Invalid time format', {
          time: params.time,
        }),
      };
    }
    targetHours = parseInt(timeMatch[1], 10);
    targetMinutes = parseInt(timeMatch[2], 10);
    if (targetHours < 0 || targetHours > 23 || targetMinutes < 0 || targetMinutes > 59) {
      throw {
        error: createError(TimeServerErrorCodes.INVALID_PARAMETER, 'Invalid time format', {
          time: params.time,
        }),
      };
    }
  }

  let nextDate: Date;

  switch (pattern) {
    case 'daily': {
      if (timezone !== 'UTC') {
        // Work in the target timezone
        const zonedStart = toZonedTime(startFrom, timezone);
        nextDate = new Date(zonedStart);

        if (targetHours !== null && targetMinutes !== null) {
          nextDate = setHours(nextDate, targetHours);
          nextDate = setMinutes(nextDate, targetMinutes);
          nextDate = setSeconds(nextDate, 0);
          nextDate = setMilliseconds(nextDate, 0);

          // If the time has already passed today, move to tomorrow
          if (!isAfter(nextDate, zonedStart)) {
            nextDate = addDays(nextDate, 1);
          }
        } else {
          // No specific time, just add one day
          nextDate = addDays(nextDate, 1);
        }

        // Convert back to UTC
        nextDate = fromZonedTime(nextDate, timezone);
      } else {
        nextDate = new Date(startFrom);

        if (targetHours !== null && targetMinutes !== null) {
          // Use UTC setters when no timezone
          nextDate.setUTCHours(targetHours);
          nextDate.setUTCMinutes(targetMinutes);
          nextDate.setUTCSeconds(0);
          nextDate.setUTCMilliseconds(0);

          // If the time has already passed today, move to tomorrow
          if (!isAfter(nextDate, startFrom)) {
            nextDate = addDays(nextDate, 1);
          }
        } else {
          // No specific time, just add one day
          nextDate = addDays(nextDate, 1);
        }
      }
      break;
    }

    case 'weekly': {
      // Validate day_of_week if provided
      if (params.day_of_week !== undefined && (params.day_of_week < 0 || params.day_of_week > 6)) {
        throw {
          error: createError(TimeServerErrorCodes.INVALID_PARAMETER, 'Invalid day_of_week', {
            day_of_week: params.day_of_week,
          }),
        };
      }

      if (timezone !== 'UTC') {
        const zonedStart = toZonedTime(startFrom, timezone);
        const targetDay = params.day_of_week ?? getDay(zonedStart);
        const currentDay = getDay(zonedStart);
        let daysToAdd = (targetDay - currentDay + 7) % 7;

        // If same day of week
        if (daysToAdd === 0) {
          if (targetHours !== null && targetMinutes !== null) {
            // Check if time has passed
            let testDate = new Date(zonedStart);
            testDate = setHours(testDate, targetHours);
            testDate = setMinutes(testDate, targetMinutes);
            testDate = setSeconds(testDate, 0);
            testDate = setMilliseconds(testDate, 0);

            if (isAfter(testDate, zonedStart)) {
              // Time hasn't passed, use today
              nextDate = testDate;
            } else {
              // Time has passed, next week
              nextDate = addWeeks(zonedStart, 1);
              if (targetHours !== null && targetMinutes !== null) {
                nextDate = setHours(nextDate, targetHours);
                nextDate = setMinutes(nextDate, targetMinutes);
                nextDate = setSeconds(nextDate, 0);
                nextDate = setMilliseconds(nextDate, 0);
              }
            }
          } else {
            // No specific time, force next week
            daysToAdd = 7;
            nextDate = addDays(zonedStart, daysToAdd);
          }
        } else {
          nextDate = addDays(zonedStart, daysToAdd);
          // Set time if specified
          if (targetHours !== null && targetMinutes !== null) {
            nextDate = setHours(nextDate, targetHours);
            nextDate = setMinutes(nextDate, targetMinutes);
            nextDate = setSeconds(nextDate, 0);
            nextDate = setMilliseconds(nextDate, 0);
          }
        }

        // Convert back to UTC
        nextDate = fromZonedTime(nextDate, timezone);
      } else {
        const targetDay = params.day_of_week ?? getDay(startFrom);
        const currentDay = getDay(startFrom);
        let daysToAdd = (targetDay - currentDay + 7) % 7;

        // If same day of week
        if (daysToAdd === 0) {
          if (targetHours !== null && targetMinutes !== null) {
            // Check if time has passed
            const testDate = new Date(startFrom);
            testDate.setUTCHours(targetHours);
            testDate.setUTCMinutes(targetMinutes);
            testDate.setUTCSeconds(0);
            testDate.setUTCMilliseconds(0);

            if (isAfter(testDate, startFrom)) {
              // Time hasn't passed, use today
              nextDate = testDate;
            } else {
              // Time has passed, next week
              nextDate = addWeeks(startFrom, 1);
              if (targetHours !== null && targetMinutes !== null) {
                nextDate.setUTCHours(targetHours);
                nextDate.setUTCMinutes(targetMinutes);
                nextDate.setUTCSeconds(0);
                nextDate.setUTCMilliseconds(0);
              }
            }
          } else {
            // No specific time, force next week
            daysToAdd = 7;
            nextDate = addDays(startFrom, daysToAdd);
          }
        } else {
          nextDate = addDays(startFrom, daysToAdd);
          // Set time if specified
          if (targetHours !== null && targetMinutes !== null) {
            nextDate.setUTCHours(targetHours);
            nextDate.setUTCMinutes(targetMinutes);
            nextDate.setUTCSeconds(0);
            nextDate.setUTCMilliseconds(0);
          }
        }
      }
      break;
    }

    case 'monthly': {
      // Validate day_of_month if provided
      if (
        params.day_of_month !== undefined &&
        (params.day_of_month < 1 || params.day_of_month > 31)
      ) {
        throw {
          error: createError(TimeServerErrorCodes.INVALID_PARAMETER, 'Invalid day_of_month', {
            day_of_month: params.day_of_month,
          }),
        };
      }

      if (timezone !== 'UTC') {
        const zonedStart = toZonedTime(startFrom, timezone);
        const targetDayOfMonth = params.day_of_month ?? getDate(zonedStart);
        const currentDayOfMonth = getDate(zonedStart);
        nextDate = new Date(zonedStart);

        // Always go to next month for monthly pattern
        if (
          currentDayOfMonth === targetDayOfMonth &&
          targetHours !== null &&
          targetMinutes !== null
        ) {
          // Check if time has passed today
          let testDate = new Date(zonedStart);
          testDate = setHours(testDate, targetHours);
          testDate = setMinutes(testDate, targetMinutes);
          testDate = setSeconds(testDate, 0);
          testDate = setMilliseconds(testDate, 0);

          if (isAfter(testDate, zonedStart)) {
            // Time hasn't passed, use today
            nextDate = testDate;
          } else {
            // Time has passed, next month
            nextDate = addMonths(nextDate, 1);
            nextDate = setDate(nextDate, targetDayOfMonth);
          }
        } else if (currentDayOfMonth >= targetDayOfMonth) {
          // Day has passed, next month
          nextDate = addMonths(nextDate, 1);
          nextDate = setDate(nextDate, targetDayOfMonth);
        } else {
          // Day hasn't passed, this month
          nextDate = setDate(nextDate, targetDayOfMonth);
        }

        // Handle months with fewer days
        if (getDate(nextDate) !== targetDayOfMonth) {
          // We overflowed, use last day of previous month
          nextDate = new Date(nextDate);
          nextDate.setDate(0); // Last day of previous month
        }

        // Set time if specified
        if (targetHours !== null && targetMinutes !== null) {
          nextDate = setHours(nextDate, targetHours);
          nextDate = setMinutes(nextDate, targetMinutes);
          nextDate = setSeconds(nextDate, 0);
          nextDate = setMilliseconds(nextDate, 0);
        }

        // Convert back to UTC
        nextDate = fromZonedTime(nextDate, timezone);
      } else {
        const targetDayOfMonth = params.day_of_month ?? getDate(startFrom);
        const currentDayOfMonth = getDate(startFrom);
        nextDate = new Date(startFrom);

        // Always go to next month for monthly pattern
        if (
          currentDayOfMonth === targetDayOfMonth &&
          targetHours !== null &&
          targetMinutes !== null
        ) {
          // Check if time has passed today
          const testDate = new Date(startFrom);
          testDate.setUTCHours(targetHours);
          testDate.setUTCMinutes(targetMinutes);
          testDate.setUTCSeconds(0);
          testDate.setUTCMilliseconds(0);

          if (isAfter(testDate, startFrom)) {
            // Time hasn't passed, use today
            nextDate = testDate;
          } else {
            // Time has passed, next month
            nextDate = addMonths(nextDate, 1);
            nextDate = setDate(nextDate, targetDayOfMonth);
          }
        } else if (currentDayOfMonth >= targetDayOfMonth) {
          // Day has passed, next month
          nextDate = addMonths(nextDate, 1);
          nextDate = setDate(nextDate, targetDayOfMonth);
        } else {
          // Day hasn't passed, this month
          nextDate = setDate(nextDate, targetDayOfMonth);
        }

        // Handle months with fewer days
        if (getDate(nextDate) !== targetDayOfMonth) {
          // We overflowed, use last day of previous month
          nextDate = new Date(nextDate);
          nextDate.setDate(0); // Last day of previous month
        }

        // Set time if specified
        if (targetHours !== null && targetMinutes !== null) {
          nextDate.setUTCHours(targetHours);
          nextDate.setUTCMinutes(targetMinutes);
          nextDate.setUTCSeconds(0);
          nextDate.setUTCMilliseconds(0);
        }
      }
      break;
    }

    case 'yearly': {
      if (timezone !== 'UTC') {
        const zonedStart = toZonedTime(startFrom, timezone);
        nextDate = addYears(zonedStart, 1);

        // Set time if specified
        if (targetHours !== null && targetMinutes !== null) {
          nextDate = setHours(nextDate, targetHours);
          nextDate = setMinutes(nextDate, targetMinutes);
          nextDate = setSeconds(nextDate, 0);
          nextDate = setMilliseconds(nextDate, 0);
        }

        // Convert back to UTC
        nextDate = fromZonedTime(nextDate, timezone);
      } else {
        nextDate = addYears(startFrom, 1);

        // Set time if specified
        if (targetHours !== null && targetMinutes !== null) {
          nextDate.setUTCHours(targetHours);
          nextDate.setUTCMinutes(targetMinutes);
          nextDate.setUTCSeconds(0);
          nextDate.setUTCMilliseconds(0);
        }
      }
      break;
    }

    default:
      // Should never reach here due to validation above
      throw {
        error: createError(TimeServerErrorCodes.INVALID_PARAMETER, 'Invalid pattern', {
          pattern,
        }),
      };
  }

  // nextDate is already in UTC
  const utcNext = nextDate;

  // Calculate days until
  const now = new Date();
  const daysUntil = differenceInDays(startOfDay(utcNext), startOfDay(now));

  const result: NextOccurrenceResult = {
    next: utcNext.toISOString(),
    unix: Math.floor(utcNext.getTime() / 1000),
    days_until: Math.max(0, daysUntil),
  };

  // Cache the result
  cache.set(cacheKey, result, CacheTTL.CALCULATIONS);

  return result;
}
