import { eachDayOfInterval, isWeekend, parseISO, isValid } from 'date-fns';
import { toDate } from 'date-fns-tz';
import { cache, CacheTTL } from '../cache/timeCache';
import { hashCacheKey } from '../cache/cacheKeyHash';
import {
  validateTimezone,
  createError,
  validateArrayLength,
  validateDateString,
  LIMITS,
} from '../utils/validation';
import { getConfig } from '../utils/config';
import { TimeServerErrorCodes } from '../types';
import type { GetBusinessDaysParams, GetBusinessDaysResult } from '../types';
import { getHolidaysForYear } from '../data/holidays';

export function getBusinessDays(params: GetBusinessDaysParams): GetBusinessDaysResult {
  const { start_date, end_date, holidays = [], holiday_calendar, custom_holidays = [] } = params;

  // Validate string lengths and array lengths first
  validateDateString(start_date, 'start_date');
  validateDateString(end_date, 'end_date');
  validateArrayLength(holidays, LIMITS.MAX_ARRAY_LENGTH, 'holidays');
  validateArrayLength(custom_holidays, LIMITS.MAX_ARRAY_LENGTH, 'custom_holidays');

  const excludeWeekends = params.exclude_weekends ?? true;
  const includeObserved = params.include_observed ?? true;
  const config = getConfig();
  const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);

  // Generate cache key
  const rawCacheKey = `business_${start_date}_${end_date}_${excludeWeekends}_${timezone}_${holidays.join(',')}_${holiday_calendar ?? ''}_${includeObserved}_${custom_holidays.join(',')}`;
  const cacheKey = hashCacheKey(rawCacheKey);

  // Check cache
  const cached = cache.get<GetBusinessDaysResult>(cacheKey);
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
  const startDate = parseDate(start_date, 'start_date');
  const endDate = parseDate(end_date, 'end_date');

  // Collect all holiday dates
  const allHolidayDates = new Set<string>(); // Use Set to avoid duplicates

  // Add calendar holidays if specified
  if (holiday_calendar) {
    // Validate holiday_calendar parameter
    if (holiday_calendar.includes('\0') || holiday_calendar.includes('\x00')) {
      throw {
        error: createError(
          TimeServerErrorCodes.INVALID_PARAMETER,
          'Invalid holiday_calendar: contains null bytes',
          { holiday_calendar },
        ),
      };
    }

    // Validate it's a reasonable country code (2-3 uppercase letters)
    if (!/^[A-Z]{2,3}$/.test(holiday_calendar)) {
      throw {
        error: createError(
          TimeServerErrorCodes.INVALID_PARAMETER,
          'Invalid holiday_calendar: must be a 2-3 letter country code',
          { holiday_calendar },
        ),
      };
    }

    // Get holidays for the years covered by the date range
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const calendarHolidays = getHolidaysForYear(holiday_calendar, year);
      for (const holiday of calendarHolidays) {
        // Use observed date if available and include_observed is true
        const dateToUse =
          includeObserved && holiday.observedDate ? holiday.observedDate : holiday.date;
        // Add holiday date string - holidays outside range won't match days anyway
        allHolidayDates.add(dateToUse.toDateString());
      }
    }
  }

  // Add custom holidays
  for (const customHoliday of custom_holidays) {
    try {
      const holidayDate = parseISO(customHoliday);
      if (!isValid(holidayDate)) {
        throw new Error('Invalid date');
      }
      allHolidayDates.add(holidayDate.toDateString());
    } catch (error) {
      throw {
        error: createError(
          TimeServerErrorCodes.INVALID_DATE_FORMAT,
          `Invalid custom holiday date: ${customHoliday}`,
          {
            holiday: customHoliday,
            error: error instanceof Error ? error.message : String(error),
          },
        ),
      };
    }
  }

  // Add legacy holidays parameter for backward compatibility
  for (let i = 0; i < holidays.length; i++) {
    // eslint-disable-next-line security/detect-object-injection -- Array index access
    const holiday = holidays[i];
    try {
      const holidayDate = parseISO(holiday);
      if (!isValid(holidayDate)) {
        throw new Error('Invalid date');
      }
      allHolidayDates.add(holidayDate.toDateString());
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

  // Get all days in the interval
  // For business days, we work with the dates as they are
  // eachDayOfInterval will handle the day boundaries correctly
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Calculate different categories
  let businessDays = 0;
  let weekendDays = 0;
  let holidayCount = 0;

  for (const day of days) {
    const isWeekendDay = isWeekend(day);
    const isHolidayDay = allHolidayDates.has(day.toDateString());

    if (isWeekendDay) {
      weekendDays++;
    } else if (isHolidayDay) {
      holidayCount++;
    } else {
      businessDays++;
    }
  }

  // If not excluding weekends, add weekend days to business days
  if (!excludeWeekends) {
    businessDays += weekendDays;
  }

  const result: GetBusinessDaysResult = {
    total_days: days.length,
    business_days: businessDays,
    weekend_days: weekendDays,
    holiday_count: holidayCount,
  };

  // Cache the result
  cache.set(cacheKey, result, CacheTTL.BUSINESS_DAYS);

  return result;
}
