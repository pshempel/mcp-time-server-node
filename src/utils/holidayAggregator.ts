/**
 * Holiday Aggregator Utility
 *
 * Consolidates holiday dates from multiple sources into a single Set.
 * Reduces ~60 lines of complex holiday aggregation logic to a single function call.
 *
 * Handles:
 * - Calendar holidays from country codes (with observed dates)
 * - Custom holiday date strings
 * - Legacy holiday parameter for backward compatibility
 * - Date range filtering
 * - Deduplication across sources
 */

import { getHolidaysForYear } from '../data/holidays';

import { parseHolidayDates } from './businessUtils';
import { debug } from './debug';

export interface HolidayAggregatorParams {
  /** Country calendar code (e.g., 'US', 'UK') */
  calendar?: string;
  /** Custom holiday date strings */
  custom?: string[];
  /** Legacy holiday parameter for backward compatibility */
  legacy?: string[];
  /** Whether to use observed dates for calendar holidays */
  includeObserved: boolean;
  /** Timezone for parsing dates */
  timezone: string;
  /** Date range to fetch calendar holidays */
  dateRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Aggregates holidays from multiple sources into a single Set
 *
 * @param params - Holiday aggregation parameters
 * @returns Set of holiday date strings (using toDateString() format)
 * @throws Error if calendar code is invalid or custom holidays can't be parsed
 *
 * @example
 * ```typescript
 * const holidays = aggregateHolidays({
 *   calendar: 'US',
 *   custom: ['2025-03-15'],
 *   legacy: ['2025-06-20'],
 *   includeObserved: true,
 *   timezone: 'America/New_York',
 *   dateRange: { start: new Date('2025-01-01'), end: new Date('2025-12-31') }
 * });
 * // Returns Set with all unique holiday dates
 * ```
 */
export function aggregateHolidays(params: HolidayAggregatorParams): Set<string> {
  const { calendar, custom = [], legacy = [], includeObserved, timezone, dateRange } = params;

  const allHolidayDates = new Set<string>();
  const { start, end } = dateRange;

  debug.business(
    'Aggregating holidays from %d sources',
    [calendar, custom.length > 0, legacy.length > 0].filter(Boolean).length
  );

  // 1. Add calendar holidays if specified
  if (calendar) {
    addCalendarHolidays(allHolidayDates, calendar, includeObserved, start, end);
  }

  // 2. Add custom holidays
  if (custom.length > 0) {
    let customDates: Date[];
    try {
      customDates = parseHolidayDates(custom, timezone);
    } catch (error) {
      // Re-throw with more specific error message for custom holidays
      const errorObj = error as { error?: { message?: string; data?: { holiday?: string } } };
      const originalMessage = errorObj.error?.message ?? String(error);
      const invalidHoliday = errorObj.error?.data?.holiday;

      debug.error('Invalid custom holiday date: %s, error: %s', invalidHoliday ?? 'unknown', originalMessage);
      throw {
        error: {
          code: 'INVALID_DATE_FORMAT',
          message: `Invalid custom holiday date: ${invalidHoliday ?? 'unknown'}`,
          data: { holiday: invalidHoliday, error: originalMessage },
        },
      };
    }

    let addedCount = 0;
    for (const date of customDates) {
      // Check if holiday is within date range
      if (date >= start && date <= end) {
        allHolidayDates.add(date.toDateString());
        addedCount++;
      }
    }

    debug.business('Added %d custom holidays (from %d provided)', addedCount, custom.length);
  }

  // 3. Add legacy holidays (backward compatibility)
  if (legacy.length > 0) {
    const legacyDates = parseHolidayDates(legacy, timezone);
    let addedCount = 0;

    for (const date of legacyDates) {
      // Check if holiday is within date range
      if (date >= start && date <= end) {
        allHolidayDates.add(date.toDateString());
        addedCount++;
      }
    }

    debug.business('Added %d legacy holidays (from %d provided)', addedCount, legacy.length);
  }

  debug.business('Total unique holidays aggregated: %d', allHolidayDates.size);

  return allHolidayDates;
}

/**
 * Helper function to add calendar holidays to the set
 * Extracted to reduce nesting and complexity
 */
function addCalendarHolidays(
  holidaySet: Set<string>,
  calendar: string,
  includeObserved: boolean,
  start: Date,
  end: Date
): void {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const initialSize = holidaySet.size;

  for (let year = startYear; year <= endYear; year++) {
    const holidays = getHolidaysForYear(calendar, year);

    for (const holiday of holidays) {
      // Use observed date if available and include_observed is true
      const dateToUse =
        includeObserved && holiday.observedDate ? holiday.observedDate : holiday.date;

      // Add holiday date string - no need to filter by range here
      // as getBusinessDays will only count holidays that fall on actual days in the interval
      holidaySet.add(dateToUse.toDateString());
    }
  }

  debug.business('Added %d calendar holidays from %s', holidaySet.size - initialSize, calendar);
}

/**
 * Validates a holiday calendar code
 *
 * @param calendar - Calendar code to validate
 * @returns true if valid, false otherwise
 */
export function isValidCalendarCode(calendar: string): boolean {
  try {
    // Try to get holidays for current year as a validation check
    getHolidaysForYear(calendar, new Date().getFullYear());
    return true;
  } catch {
    return false;
  }
}
