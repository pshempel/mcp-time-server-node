import { format, isWeekend } from 'date-fns';

import { ValidationError } from '../adapters/mcp-sdk';

import { debug } from './debug';

export interface DayCategories {
  businessDays: number;
  weekendDays: number;
  holidayCount: number;
}

/**
 * Validates a holiday calendar code
 * @param calendar - The calendar code to validate (e.g., 'US', 'UK')
 * @throws ValidationError if the calendar code is invalid
 */
export function validateHolidayCalendar(calendar: string): void {
  if (calendar.includes('\0') || calendar.includes('\x00')) {
    debug.error('Invalid holiday_calendar contains null bytes: %s', calendar);
    throw new ValidationError('Invalid holiday_calendar: contains null bytes', {
      holiday_calendar: calendar,
    });
  }

  if (!/^[A-Z]{2,3}$/.test(calendar)) {
    debug.error('Invalid holiday_calendar format: %s', calendar);
    throw new ValidationError('Invalid holiday_calendar: must be a 2-3 letter country code', {
      holiday_calendar: calendar,
    });
  }
}

/**
 * Validates that a date range doesn't exceed 100 years (DoS protection)
 * @param startDate - Start date
 * @param endDate - End date
 * @param start_date - Original start date string for error reporting
 * @param end_date - Original end date string for error reporting
 * @throws ValidationError if the date range exceeds 100 years
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date,
  start_date: string,
  end_date: string
): void {
  const daysDifference = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDifference > 36525) {
    // Allow exactly 100 years (including leap years)
    debug.error('Date range too large: %d days (max 36500)', daysDifference);
    throw new ValidationError('Date range exceeds maximum limit of 100 years', {
      start_date,
      end_date,
      days: Math.floor(daysDifference),
      max_days: 36500,
    });
  }
}

/**
 * Categorizes an array of days into business days, weekends, and holidays
 * @param days - Array of dates to categorize
 * @param allHolidayDates - Set of holiday date strings (toDateString() format)
 * @returns Object with counts for each category
 */
export function categorizeDays(days: Date[], allHolidayDates: Set<string>): DayCategories {
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

  return {
    businessDays,
    weekendDays,
    holidayCount,
  };
}

/**
 * Adjusts business day count based on weekend inclusion preference
 * @param categories - Day categories from categorizeDays
 * @param excludeWeekends - Whether to exclude weekends from business days
 * @returns Adjusted day categories
 */
export function adjustForWeekends(
  categories: DayCategories,
  excludeWeekends: boolean
): DayCategories {
  if (!excludeWeekends) {
    debug.decision('Including weekends', {
      weekendDays: categories.weekendDays,
      businessDaysBefore: categories.businessDays,
      businessDaysAfter: categories.businessDays + categories.weekendDays,
    });

    return {
      ...categories,
      businessDays: categories.businessDays + categories.weekendDays,
    };
  }

  return categories;
}
