import { eachDayOfInterval, isWeekend, format } from 'date-fns';

import { CacheTTL } from '../cache/timeCache';
import { TimeServerErrorCodes } from '../types';
import type { GetBusinessDaysParams, GetBusinessDaysResult } from '../types';
import { parseDateWithTimezone } from '../utils/businessUtils';
import { buildCacheKey } from '../utils/cacheKeyBuilder';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { aggregateHolidays } from '../utils/holidayAggregator';
import { resolveTimezone } from '../utils/timezoneUtils';
import {
  validateTimezone,
  createError,
  validateArrayLength,
  validateDateString,
  LIMITS,
} from '../utils/validation';
import { withCache } from '../utils/withCache';

// eslint-disable-next-line max-lines-per-function -- Enhanced debug logging for production observability
export function getBusinessDays(params: GetBusinessDaysParams): GetBusinessDaysResult {
  const { start_date, end_date, holidays = [], holiday_calendar, custom_holidays = [] } = params;

  // Log entry with all parameters to show what was provided
  debug.business('getBusinessDays called with params: %O', {
    start_date,
    end_date,
    timezone: params.timezone,
    exclude_weekends: params.exclude_weekends,
    holiday_calendar,
    holidays_count: holidays.length,
    custom_holidays_count: custom_holidays.length,
  });

  // Important: Log if no country parameter provided but holidays expected
  if (!holiday_calendar && holidays.length === 0 && custom_holidays.length === 0) {
    debug.validation('No holiday information provided (no country/calendar, no explicit holidays)');
  }

  // Validate string lengths and array lengths first
  validateDateString(start_date, 'start_date');
  validateDateString(end_date, 'end_date');
  validateArrayLength(holidays, LIMITS.MAX_ARRAY_LENGTH, 'holidays');
  validateArrayLength(custom_holidays, LIMITS.MAX_ARRAY_LENGTH, 'custom_holidays');

  const excludeWeekends = params.exclude_weekends ?? true;
  const includeObserved = params.include_observed ?? true;
  const config = getConfig();
  const timezone = resolveTimezone(params.timezone, config.defaultTimezone);

  debug.timezone('Resolved timezone: %s (from: %s)', timezone, params.timezone ?? 'default');

  // Build cache key using new utility
  const cacheKey = buildCacheKey('business', {
    single: { timezone },
    dates: [start_date, end_date],
    flags: { excludeWeekends, includeObserved },
    arrays: { holidays, customHolidays: custom_holidays },
    optional: { calendar: holiday_calendar },
  });

  // Use withCache wrapper
  return withCache(cacheKey, CacheTTL.BUSINESS_DAYS, () => {
    // Validate timezone if provided
    if (timezone && !validateTimezone(timezone)) {
      throw {
        error: createError(TimeServerErrorCodes.INVALID_TIMEZONE, `Invalid timezone: ${timezone}`, {
          timezone,
        }),
      };
    }

    // Validate holiday_calendar if provided
    if (holiday_calendar) {
      if (holiday_calendar.includes('\0') || holiday_calendar.includes('\x00')) {
        throw {
          error: createError(
            TimeServerErrorCodes.INVALID_PARAMETER,
            'Invalid holiday_calendar: contains null bytes',
            { holiday_calendar }
          ),
        };
      }

      if (!/^[A-Z]{2,3}$/.test(holiday_calendar)) {
        throw {
          error: createError(
            TimeServerErrorCodes.INVALID_PARAMETER,
            'Invalid holiday_calendar: must be a 2-3 letter country code',
            { holiday_calendar }
          ),
        };
      }
    }

    // Parse dates
    const startDate = parseDateWithTimezone(start_date, timezone, 'start_date');
    const endDate = parseDateWithTimezone(end_date, timezone, 'end_date');

    // Log calculation context
    debug.business(
      'Business days calculation: %s to %s',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    );

    // Use the new holidayAggregator utility
    debug.holidays('Aggregating holidays for calendar: %s', holiday_calendar ?? 'none');
    const allHolidayDates = aggregateHolidays({
      calendar: holiday_calendar,
      includeObserved,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      custom: custom_holidays,
      legacy: holidays,
      timezone,
    });
    debug.holidays('Total holidays found: %d', allHolidayDates.size);
    if (allHolidayDates.size > 0) {
      debug.holidays('Holiday dates: %O', Array.from(allHolidayDates));
    }

    // Get all days in the interval
    const days = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
    debug.timing('Processing %d days from %s to %s', days.length, start_date, end_date);

    // Calculate different categories
    let businessDays = 0;
    let weekendDays = 0;
    let holidayCount = 0;

    for (const day of days) {
      const isWeekendDay = isWeekend(day);
      const isHolidayDay = allHolidayDates.has(day.toDateString());
      const dayStr = format(day, 'yyyy-MM-dd');

      if (isWeekendDay) {
        weekendDays++;
        debug.trace('  %s: weekend', dayStr);
      } else if (isHolidayDay) {
        holidayCount++;
        debug.trace('  %s: holiday', dayStr);
      } else {
        businessDays++;
        debug.trace('  %s: business day', dayStr);
      }
    }

    // If not excluding weekends, add weekend days to business days
    if (!excludeWeekends) {
      debug.decision('Including weekends', {
        weekendDays,
        businessDaysBefore: businessDays,
        businessDaysAfter: businessDays + weekendDays,
      });
      businessDays += weekendDays;
    }

    // Log summary
    debug.business(
      'Calculated business days: %d of %d total days (%d weekends, %d holidays)',
      businessDays,
      days.length,
      weekendDays,
      holidayCount
    );

    const result: GetBusinessDaysResult = {
      total_days: days.length,
      business_days: businessDays,
      weekend_days: weekendDays,
      holiday_count: holidayCount,
    };

    return result;
  });
}
