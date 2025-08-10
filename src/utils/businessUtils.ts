/**
 * Shared utilities for business day/hour calculations.
 * Extracted from calculateBusinessHours and getBusinessDays.
 *
 * IMPORTANT: These utilities extract only the IDENTICAL patterns.
 * Tool-specific logic remains in each tool.
 */

import { DateParsingError, HolidayDataError } from '../adapters/mcp-sdk/errors';

import { debug } from './debug';
import { parseTimeInput } from './parseTimeInput';

/**
 * Parse a date string with timezone awareness.
 * This is the exact helper pattern used in both calculateBusinessHours and getBusinessDays.
 *
 * @param dateStr - The date string to parse
 * @param timezone - The timezone to use for parsing
 * @param fieldName - The field name for error reporting
 * @returns Parsed Date object
 * @throws Error with standard structure if parsing fails
 */
export function parseDateWithTimezone(dateStr: string, timezone: string, fieldName: string): Date {
  try {
    return parseTimeInput(dateStr, timezone).date;
  } catch (error) {
    debug.error(
      'Invalid %s format: %s, error: %s',
      fieldName,
      dateStr,
      error instanceof Error ? error.message : String(error)
    );
    throw new DateParsingError(`Invalid ${fieldName} format: ${dateStr}`, {
      [fieldName]: dateStr,
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Parse an array of holiday date strings.
 * Common pattern extracted from both tools, though each has variations.
 *
 * @param holidays - Array of date strings representing holidays
 * @param timezone - Timezone for parsing the dates
 * @returns Array of parsed Date objects
 * @throws Error with standard structure if any date is invalid
 */
export function parseHolidayDates(holidays: string[], timezone: string): Date[] {
  const holidayDates: Date[] = [];

  for (let i = 0; i < holidays.length; i++) {
    // eslint-disable-next-line security/detect-object-injection -- Array index access
    const holiday = holidays[i];
    try {
      holidayDates.push(parseTimeInput(holiday, timezone).date);
    } catch (error) {
      debug.error(
        'Invalid holiday date: %s at index %d, error: %s',
        holiday,
        i,
        error instanceof Error ? error.message : String(error)
      );
      throw new HolidayDataError(`Invalid holiday date: ${holiday}`, {
        holiday,
        index: i,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return holidayDates;
}
