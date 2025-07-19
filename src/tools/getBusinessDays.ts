import { eachDayOfInterval, isWeekend, parseISO, isSameDay, isValid } from 'date-fns';
import { toDate } from 'date-fns-tz';
import { cache, CacheTTL } from '../cache/timeCache';
import { validateTimezone, createError } from '../utils/validation';
import { getConfig } from '../utils/config';
import { TimeServerErrorCodes } from '../types';
import type { GetBusinessDaysParams, GetBusinessDaysResult } from '../types';

export function getBusinessDays(params: GetBusinessDaysParams): GetBusinessDaysResult {
  const { start_date, end_date, holidays = [] } = params;
  const excludeWeekends = params.exclude_weekends ?? true;
  const config = getConfig();
  const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);

  // Generate cache key
  const cacheKey = `business_${start_date}_${end_date}_${excludeWeekends}_${timezone}_${holidays.join(',')}`;

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

  // Parse holiday dates
  const holidayDates: Date[] = [];
  for (let i = 0; i < holidays.length; i++) {
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
    const isHoliday = holidayDates.some((h) => isSameDay(day, h));

    if (isWeekendDay) {
      weekendDays++;
    } else if (isHoliday) {
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
