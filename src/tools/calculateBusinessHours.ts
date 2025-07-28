import { parseISO, isValid, differenceInMinutes, format } from 'date-fns';
import { toDate, formatInTimeZone } from 'date-fns-tz';
import { cache, CacheTTL } from '../cache/timeCache';
import { hashCacheKey } from '../cache/cacheKeyHash';
import {
  validateTimezone,
  createError,
  validateDateString,
  validateArrayLength,
  LIMITS,
} from '../utils/validation';
import { getConfig } from '../utils/config';
import { TimeServerErrorCodes } from '../types';
import type {
  CalculateBusinessHoursParams,
  CalculateBusinessHoursResult,
  BusinessHours,
  WeeklyBusinessHours,
  DayBusinessHours,
} from '../types';

// Default business hours: 9 AM - 5 PM
const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  start: { hour: 9, minute: 0 },
  end: { hour: 17, minute: 0 },
};

// Day names for output
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function isWeeklyBusinessHours(
  hours: BusinessHours | WeeklyBusinessHours,
): hours is WeeklyBusinessHours {
  return typeof hours === 'object' && !('start' in hours);
}

function validateBusinessHours(hours: BusinessHours): void {
  if (hours.start.hour < 0 || hours.start.hour > 23) {
    throw new Error('Invalid start hour');
  }
  if (hours.start.minute < 0 || hours.start.minute > 59) {
    throw new Error('Invalid start minute');
  }
  if (hours.end.hour < 0 || hours.end.hour > 23) {
    throw new Error('Invalid end hour');
  }
  if (hours.end.minute < 0 || hours.end.minute > 59) {
    throw new Error('Invalid end minute');
  }
}

export function calculateBusinessHours(
  params: CalculateBusinessHoursParams,
): CalculateBusinessHoursResult {
  const { start_time, end_time, holidays = [], include_weekends = false } = params;

  // Validate string lengths first
  validateDateString(start_time, 'start_time');
  validateDateString(end_time, 'end_time');
  validateArrayLength(holidays, LIMITS.MAX_ARRAY_LENGTH, 'holidays');

  const config = getConfig();
  const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);

  // Generate cache key
  const businessHoursKey = params.business_hours
    ? JSON.stringify(params.business_hours)
    : 'default';
  const rawCacheKey = `business_hours_${start_time}_${end_time}_${timezone}_${businessHoursKey}_${holidays.join(',')}_${include_weekends}`;
  const cacheKey = hashCacheKey(rawCacheKey);

  // Check cache
  const cached = cache.get<CalculateBusinessHoursResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Validate timezone if provided
  if (timezone && !validateTimezone(timezone)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_TIMEZONE, `Invalid timezone: ${timezone}`, {
        timezone,
      }),
    };
  }

  // Validate business hours if custom ones provided
  if (params.business_hours) {
    if (isWeeklyBusinessHours(params.business_hours)) {
      // Validate each day's hours
      for (const [day, hours] of Object.entries(params.business_hours)) {
        const dayNum = parseInt(day, 10);
        if (dayNum < 0 || dayNum > 6) {
          throw {
            error: createError(
              TimeServerErrorCodes.INVALID_PARAMETER,
              `Invalid day of week: ${day}`,
              { day },
            ),
          };
        }
        if (hours !== null) {
          try {
            validateBusinessHours(hours as BusinessHours);
          } catch (error) {
            throw {
              error: createError(
                TimeServerErrorCodes.INVALID_PARAMETER,
                `Invalid business hours for day ${day}: ${error instanceof Error ? error.message : String(error)}`,
                { day, hours: hours as BusinessHours },
              ),
            };
          }
        }
      }
    } else {
      try {
        validateBusinessHours(params.business_hours);
      } catch (error) {
        throw {
          error: createError(
            TimeServerErrorCodes.INVALID_PARAMETER,
            `Invalid business hours: ${error instanceof Error ? error.message : String(error)}`,
            { business_hours: params.business_hours },
          ),
        };
      }
    }
  }

  // Helper function to parse date with timezone awareness
  const parseDate = (dateStr: string, fieldName: string): Date => {
    try {
      let date: Date;

      if (/^\d+$/.test(dateStr)) {
        // Unix timestamp
        const timestamp = parseInt(dateStr, 10);
        if (isNaN(timestamp)) {
          throw new Error('Invalid Unix timestamp');
        }
        date = new Date(timestamp * 1000);
      } else if (timezone && !dateStr.includes('Z') && !/[+-]\d{2}:\d{2}/.test(dateStr)) {
        // Local time with timezone parameter
        date = toDate(dateStr, { timeZone: timezone });
      } else {
        // ISO string or has timezone info
        date = parseISO(dateStr);
      }

      if (!isValid(date)) {
        throw new Error('Invalid date');
      }

      return date;
    } catch (error) {
      throw {
        error: createError(
          TimeServerErrorCodes.INVALID_DATE_FORMAT,
          `Invalid ${fieldName} format: ${dateStr}`,
          {
            [fieldName]: dateStr,
            error: error instanceof Error ? error.message : String(error),
          },
        ),
      };
    }
  };

  // Parse dates
  const startDate = parseDate(start_time, 'start_time');
  const endDate = parseDate(end_time, 'end_time');

  // Validate that end is after start
  if (endDate < startDate) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_PARAMETER,
        'End time must be after start time',
        { start_time, end_time },
      ),
    };
  }

  // Parse holiday dates
  const holidayDates: Date[] = [];
  for (let i = 0; i < holidays.length; i++) {
    // eslint-disable-next-line security/detect-object-injection -- Array index access
    const holiday = holidays[i];
    try {
      const holidayDate = parseISO(holiday);
      if (!isValid(holidayDate)) {
        throw new Error('Invalid date');
      }
      holidayDates.push(holidayDate);
    } catch (error) {
      throw {
        error: createError(
          TimeServerErrorCodes.INVALID_DATE_FORMAT,
          `Invalid holiday date: ${holiday}`,
          {
            holiday,
            index: i,
            error: error instanceof Error ? error.message : String(error),
          },
        ),
      };
    }
  }

  // Get business hours for a specific day
  const getBusinessHoursForDay = (dayOfWeek: number): BusinessHours | null => {
    if (!params.business_hours) {
      return DEFAULT_BUSINESS_HOURS;
    }

    if (isWeeklyBusinessHours(params.business_hours)) {
      // eslint-disable-next-line security/detect-object-injection -- Day of week index (0-6)
      return params.business_hours[dayOfWeek] ?? DEFAULT_BUSINESS_HOURS;
    }

    return params.business_hours;
  };

  // Calculate business hours for each day
  const breakdown: DayBusinessHours[] = [];
  let totalBusinessMinutes = 0;

  // Get unique dates in business timezone
  const datesInBizTz = new Set<string>();

  // Add all dates between start and end in business timezone
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    datesInBizTz.add(formatInTimeZone(currentDate, timezone, 'yyyy-MM-dd'));
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
  }

  // Also make sure we have the end date
  datesInBizTz.add(formatInTimeZone(endDate, timezone, 'yyyy-MM-dd'));

  for (const dayDateStr of Array.from(datesInBizTz).sort()) {
    // Create a date object for this day in the business timezone
    const day = toDate(dayDateStr + 'T12:00:00', { timeZone: timezone }); // Use noon to avoid DST issues

    // Get day of week in business timezone
    // Use 'c' format which gives us 1=Sunday, 2=Monday, etc.
    // Then subtract 1 to get 0=Sunday, 1=Monday, etc.
    const dayOfWeekInBizTz = parseInt(formatInTimeZone(day, timezone, 'c'), 10) - 1;
    // eslint-disable-next-line security/detect-object-injection -- Day of week index (0-6)
    const dayName = DAY_NAMES[dayOfWeekInBizTz];

    // Check if weekend in business timezone
    const isWeekendDay = dayOfWeekInBizTz === 0 || dayOfWeekInBizTz === 6;

    // Check if holiday
    const isHoliday = holidayDates.some((h) => format(h, 'yyyy-MM-dd') === dayDateStr);

    // Initialize day result
    const dayResult: DayBusinessHours = {
      date: dayDateStr,
      day_of_week: dayName,
      business_minutes: 0,
      is_weekend: isWeekendDay,
      is_holiday: isHoliday,
    };

    // Skip if holiday or (weekend and not including weekends)
    if (isHoliday || (isWeekendDay && !include_weekends)) {
      breakdown.push(dayResult);
      continue;
    }

    // Get business hours for this day
    const businessHours = getBusinessHoursForDay(dayOfWeekInBizTz);

    // Skip if business is closed this day
    if (!businessHours) {
      breakdown.push(dayResult);
      continue;
    }

    // Create business hours start/end times in business timezone
    const bizStartStr = `${dayDateStr}T${String(businessHours.start.hour).padStart(2, '0')}:${String(businessHours.start.minute).padStart(2, '0')}:00`;
    const bizEndStr = `${dayDateStr}T${String(businessHours.end.hour).padStart(2, '0')}:${String(businessHours.end.minute).padStart(2, '0')}:00`;

    // Parse business hours in timezone
    let dayBusinessStart = toDate(bizStartStr, { timeZone: timezone });
    let dayBusinessEnd = toDate(bizEndStr, { timeZone: timezone });

    // Adjust for actual start/end times
    if (formatInTimeZone(startDate, timezone, 'yyyy-MM-dd') === dayDateStr) {
      // This is the start day
      if (startDate > dayBusinessEnd) {
        // Started after business hours
        breakdown.push(dayResult);
        continue;
      }
      if (startDate > dayBusinessStart) {
        dayBusinessStart = startDate;
      }
    }

    if (formatInTimeZone(endDate, timezone, 'yyyy-MM-dd') === dayDateStr) {
      // This is the end day
      if (endDate < dayBusinessStart) {
        // Ended before business hours
        breakdown.push(dayResult);
        continue;
      }
      if (endDate < dayBusinessEnd) {
        dayBusinessEnd = endDate;
      }
    }

    // Calculate minutes for this day
    const minutes = Math.max(0, differenceInMinutes(dayBusinessEnd, dayBusinessStart));
    dayResult.business_minutes = minutes;
    totalBusinessMinutes += minutes;

    breakdown.push(dayResult);
  }

  const result: CalculateBusinessHoursResult = {
    total_business_minutes: totalBusinessMinutes,
    total_business_hours: totalBusinessMinutes / 60,
    breakdown,
  };

  // Cache the result
  cache.set(cacheKey, result, CacheTTL.CALCULATIONS);

  return result;
}
