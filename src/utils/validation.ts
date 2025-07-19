import { parseISO, isValid } from 'date-fns';
import { getTimezoneOffset } from 'date-fns-tz';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { TimeServerErrorCodes } from '../types';
import type { TimeServerError, TimeUnit, RecurrencePattern } from '../types';

/**
 * Validates a timezone string using date-fns-tz
 * @param timezone - The timezone to validate
 * @param allowEmpty - Whether to allow empty string (defaults to UTC)
 * @returns true if valid timezone, false otherwise
 */
export function validateTimezone(timezone: string | undefined | null, allowEmpty = false): boolean {
  if (!timezone) {
    return allowEmpty && timezone === '';
  }

  // Use getTimezoneOffset - it returns NaN for invalid timezones
  const offset = getTimezoneOffset(timezone, new Date());
  return !isNaN(offset);
}

/**
 * Validates a date string or Unix timestamp
 * @param date - The date to validate (string, number, or undefined)
 * @returns true if valid date format, false otherwise
 */
export function validateDateFormat(date: string | number | undefined | null): boolean {
  if (date === null || date === undefined || date === '') {
    return false;
  }

  // Handle Unix timestamps (number or string)
  if (typeof date === 'number') {
    return isValid(new Date(date * 1000));
  }

  if (typeof date === 'string' && /^\d+$/.test(date)) {
    const timestamp = parseInt(date, 10);
    return isValid(new Date(timestamp * 1000));
  }

  // Try to parse as ISO format
  const parsed = parseISO(date);
  return isValid(parsed);
}

/**
 * Validates a time unit
 * @param unit - The time unit to validate
 * @returns true if valid unit, false otherwise
 */
export function validateTimeUnit(unit: string): boolean {
  const validUnits: TimeUnit[] = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
  return validUnits.includes(unit as TimeUnit);
}

/**
 * Validates a recurrence pattern
 * @param pattern - The pattern to validate
 * @returns true if valid pattern, false otherwise
 */
export function validateRecurrencePattern(pattern: string): boolean {
  const validPatterns: RecurrencePattern[] = ['daily', 'weekly', 'monthly', 'yearly'];
  return validPatterns.includes(pattern as RecurrencePattern);
}

/**
 * Validates day of week (0-6, where 0 is Sunday)
 * @param day - The day to validate
 * @returns true if valid day, false otherwise
 */
export function validateDayOfWeek(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

/**
 * Validates day of month (1-31)
 * @param day - The day to validate
 * @returns true if valid day, false otherwise
 */
export function validateDayOfMonth(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

/**
 * Creates a standardized error object
 * @param code - The error code
 * @param message - The error message
 * @param details - Optional additional details
 * @returns TimeServerError object
 */
export function createError(
  code: TimeServerErrorCodes,
  message: string,
  details?: unknown,
): TimeServerError {
  const error: TimeServerError = { code, message };
  if (details !== undefined) {
    error.details = details;
  }
  return error;
}
