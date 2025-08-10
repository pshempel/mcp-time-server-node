/**
 * Helper functions for business hours calculations.
 * Extracted from calculateBusinessHours to reduce complexity.
 * Each function has a single, clear responsibility.
 */

import { format, differenceInMinutes, eachDayOfInterval } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { ValidationError } from '../adapters/mcp-sdk/errors';
import type { BusinessHours, WeeklyBusinessHours, DayBusinessHours } from '../types';

import { debug } from './debug';

// Day names for output
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Check if hours object is a weekly schedule
 */
function isWeeklyBusinessHours(
  hours: BusinessHours | WeeklyBusinessHours
): hours is WeeklyBusinessHours {
  const isWeekly = typeof hours === 'object' && !('start' in hours);
  debug.business('Schedule type detected:', {
    type: isWeekly ? 'weekly' : 'daily',
    hasStartProperty: 'start' in hours,
  });
  return isWeekly;
}

/**
 * Validate a single BusinessHours object
 * @throws Error if hours are invalid
 */
function validateSingleBusinessHours(hours: BusinessHours): void {
  if (hours.start.hour < 0 || hours.start.hour > 23) {
    debug.error('Invalid start hour: %d', hours.start.hour);
    throw new Error('Invalid start hour');
  }
  if (hours.start.minute < 0 || hours.start.minute > 59) {
    debug.error('Invalid start minute: %d', hours.start.minute);
    throw new Error('Invalid start minute');
  }
  if (hours.end.hour < 0 || hours.end.hour > 23) {
    debug.error('Invalid end hour: %d', hours.end.hour);
    throw new Error('Invalid end hour');
  }
  if (hours.end.minute < 0 || hours.end.minute > 59) {
    debug.error('Invalid end minute: %d', hours.end.minute);
    throw new Error('Invalid end minute');
  }
}

/**
 * Validate business hours structure (single or weekly)
 * Single responsibility: Validate business hours configuration
 * @param hours - Business hours to validate
 * @throws Error with details if validation fails
 */
export function validateBusinessHoursStructure(
  hours: BusinessHours | WeeklyBusinessHours | undefined
): void {
  if (!hours) return;

  if (isWeeklyBusinessHours(hours)) {
    // Validate weekly schedule
    for (const [day, dayHours] of Object.entries(hours)) {
      const dayNum = parseInt(day, 10);
      if (dayNum < 0 || dayNum > 6) {
        debug.error('Invalid day of week: %s', day);
        throw new ValidationError(`Invalid day of week: ${day}`, { day, field: 'business_hours' });
      }
      if (dayHours !== null) {
        try {
          validateSingleBusinessHours(dayHours as BusinessHours);
        } catch (error) {
          debug.error(
            'Invalid business hours for day %s: %s',
            day,
            error instanceof Error ? error.message : String(error)
          );
          throw new ValidationError(
            `Invalid business hours for day ${day}: ${error instanceof Error ? error.message : String(error)}`,
            { day, hours: dayHours as BusinessHours, field: 'business_hours' }
          );
        }
      }
    }
  } else {
    // Validate single business hours
    try {
      validateSingleBusinessHours(hours);
    } catch (error) {
      debug.error(
        'Invalid business hours: %s',
        error instanceof Error ? error.message : String(error)
      );
      throw new ValidationError(
        `Invalid business hours: ${error instanceof Error ? error.message : String(error)}`,
        { business_hours: hours, field: 'business_hours' }
      );
    }
  }
}

/**
 * Get all dates between start and end in the business timezone
 * Single responsibility: Generate date strings in business timezone
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getDatesInBusinessTimezone(
  startDate: Date,
  endDate: Date,
  timezone: string
): string[] {
  const dates = new Set<string>();

  // Get all dates in the range
  const allDates = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Convert each to business timezone date string
  for (const date of allDates) {
    dates.add(formatInTimeZone(date, timezone, 'yyyy-MM-dd'));
  }

  // Also ensure we have the end date in case of timezone edge cases
  dates.add(formatInTimeZone(endDate, timezone, 'yyyy-MM-dd'));

  const result = Array.from(dates).sort();

  // Log if timezone caused date count to differ from simple day count
  if (result.length !== allDates.length) {
    debug.decision('Timezone affected date range', {
      timezone,
      simpleDayCount: allDates.length,
      businessDayCount: result.length,
      dates: result,
    });
  }

  return result;
}

/**
 * Get day information for a date string in a timezone
 * Single responsibility: Extract day-of-week information
 * @returns Object with dayOfWeek (0-6) and dayName
 */
export function getDayInfo(
  dateStr: string,
  timezone: string
): { dayOfWeek: number; dayName: string } {
  // Create a date at noon to avoid DST issues
  const date = new Date(`${dateStr}T12:00:00`);

  // Get day of week in business timezone
  // 'c' format gives us 1=Sunday, 2=Monday, etc., so subtract 1
  const dayOfWeek = parseInt(formatInTimeZone(date, timezone, 'c'), 10) - 1;
  const dayName = DAY_NAMES[dayOfWeek];

  return { dayOfWeek, dayName };
}

/**
 * Check if a day is a work day
 * Single responsibility: Determine if work happens on this day
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @param isWeekend - Whether this day is a weekend
 * @param holidays - Array of holiday dates
 * @param includeWeekends - Whether to include weekends as work days
 * @returns true if this is a work day
 */
export function isWorkDay(
  dateStr: string,
  dayOfWeek: number,
  isWeekend: boolean,
  holidays: Date[],
  includeWeekends: boolean,
  timezone?: string
): boolean {
  // Check if it's a holiday
  // Use formatInTimeZone if timezone provided, otherwise use format for backward compatibility
  const isHoliday = timezone
    ? holidays.some((h) => formatInTimeZone(h, timezone, 'yyyy-MM-dd') === dateStr)
    : holidays.some((h) => format(h, 'yyyy-MM-dd') === dateStr);

  if (isHoliday) {
    debug.business('Day is a holiday:', { date: dateStr });
    return false;
  }

  // Check weekend
  if (isWeekend && !includeWeekends) {
    debug.business('Weekend excluded:', {
      date: dateStr,
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek],
    });
    return false;
  }

  return true;
}

/**
 * Calculate business minutes for a single day
 * Single responsibility: Calculate overlap between business hours and time range
 * @returns Number of business minutes on this day
 */
export function calculateDayBusinessMinutes(
  dateStr: string,
  businessHours: BusinessHours | null,
  dayBusinessStart: Date,
  dayBusinessEnd: Date,
  rangeStart: Date,
  rangeEnd: Date
): number {
  // No business hours means closed
  if (!businessHours) {
    debug.business('Day is closed:', { date: dateStr });
    return 0;
  }

  // Find the overlap between business hours and the range
  let effectiveStart = dayBusinessStart;
  let effectiveEnd = dayBusinessEnd;

  // Adjust for range start
  if (rangeStart > effectiveEnd) {
    // Range starts after business hours end
    debug.business('Range starts after business hours:', {
      date: dateStr,
      rangeStart: format(rangeStart, 'HH:mm'),
      businessEnd: format(effectiveEnd, 'HH:mm'),
    });
    return 0;
  }
  if (rangeStart > effectiveStart) {
    effectiveStart = rangeStart;
  }

  // Adjust for range end
  if (rangeEnd < effectiveStart) {
    // Range ends before business hours start
    debug.business('Range ends before business hours:', {
      date: dateStr,
      rangeEnd: format(rangeEnd, 'HH:mm'),
      businessStart: format(effectiveStart, 'HH:mm'),
    });
    return 0;
  }
  if (rangeEnd < effectiveEnd) {
    effectiveEnd = rangeEnd;
  }

  // Calculate minutes
  const minutes = Math.max(0, differenceInMinutes(effectiveEnd, effectiveStart));

  if (minutes > 0) {
    debug.business('Calculated business minutes:', {
      date: dateStr,
      minutes,
      effectiveStart: format(effectiveStart, 'HH:mm'),
      effectiveEnd: format(effectiveEnd, 'HH:mm'),
    });
  }

  return minutes;
}

/**
 * Build a day result object
 * Single responsibility: Create the DayBusinessHours structure
 */
export function buildDayResult(
  date: string,
  dayOfWeek: string,
  businessMinutes: number,
  isWeekend: boolean,
  isHoliday: boolean
): DayBusinessHours {
  return {
    date,
    day_of_week: dayOfWeek,
    business_minutes: businessMinutes,
    is_weekend: isWeekend,
    is_holiday: isHoliday,
  };
}
