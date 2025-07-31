import { parseISO, isValid } from 'date-fns';
import { getTimezoneOffset } from 'date-fns-tz';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { TimeServerErrorCodes } from '../types';
import type { TimeServerError, TimeUnit, RecurrencePattern } from '../types';

// Security limits for input validation
export const LIMITS = {
  MAX_STRING_LENGTH: 1000, // General string inputs
  MAX_TIMEZONE_LENGTH: 100, // IANA timezones are typically < 30 chars
  MAX_DATE_STRING_LENGTH: 100, // ISO dates are ~25 chars max
  MAX_FORMAT_LENGTH: 200, // Format strings rarely exceed 50 chars
  MAX_ARRAY_LENGTH: 365, // One year of daily entries
};

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

  // Check length first for security
  validateStringLength(timezone, LIMITS.MAX_TIMEZONE_LENGTH, 'timezone');

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

  // Strict type checking - reject objects even if they have toString()
  if (typeof date !== 'string' && typeof date !== 'number') {
    return false;
  }

  // Handle Unix timestamps (number or string)
  if (typeof date === 'number') {
    return isValid(new Date(date * 1000));
  }

  if (typeof date === 'string') {
    // Check length first for security
    validateStringLength(date, LIMITS.MAX_DATE_STRING_LENGTH, 'date');

    if (/^\d+$/.test(date)) {
      const timestamp = parseInt(date, 10);
      return isValid(new Date(timestamp * 1000));
    }

    // Try to parse as ISO format
    const parsed = parseISO(date);
    return isValid(parsed);
  }

  return false;
}

/**
 * Validates a date string with length check
 * @param dateStr - The date string to validate
 * @param fieldName - Field name for error messages
 * @returns void (throws on error)
 */
export function validateDateString(dateStr: string | undefined | null, fieldName = 'date'): void {
  if (dateStr !== undefined && dateStr !== null) {
    validateStringLength(dateStr, LIMITS.MAX_DATE_STRING_LENGTH, fieldName);
  }
}

/**
 * Validates date input with strict type checking
 * @param dateInput - The date input to validate
 * @param fieldName - Field name for error messages
 * @returns void (throws on error)
 */
export function validateDateInput(dateInput: unknown, fieldName = 'date'): void {
  // Strict type checking - only allow string or number
  if (typeof dateInput !== 'string' && typeof dateInput !== 'number') {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_PARAMETER,
        `${fieldName} must be a string or number`,
        { fieldName, type: typeof dateInput },
      ),
    };
  }

  // Additional validation for strings
  if (typeof dateInput === 'string') {
    validateStringLength(dateInput, LIMITS.MAX_DATE_STRING_LENGTH, fieldName);
  }
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
 * Validates string length
 * @param str - The string to validate
 * @param maxLength - Maximum allowed length
 * @param fieldName - Name of the field for error messages
 * @returns true if valid length, false otherwise
 */
export function validateStringLength(
  str: string | undefined | null,
  maxLength: number,
  fieldName: string,
): boolean {
  if (!str) return true; // undefined/null are handled elsewhere
  if (str.length > maxLength) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_PARAMETER,
        `${fieldName} exceeds maximum length of ${maxLength} characters`,
        { fieldName, length: str.length, maxLength },
      ),
    };
  }
  return true;
}

/**
 * Validates array length
 * @param arr - The array to validate
 * @param maxLength - Maximum allowed length
 * @param fieldName - Name of the field for error messages
 * @returns true if valid length, false otherwise
 */
export function validateArrayLength<T>(
  arr: T[] | undefined | null,
  maxLength: number,
  fieldName: string,
): boolean {
  if (!arr) return true; // undefined/null are handled elsewhere
  if (arr.length > maxLength) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_PARAMETER,
        `${fieldName} exceeds maximum array length of ${maxLength} items`,
        { fieldName, length: arr.length, maxLength },
      ),
    };
  }

  // Also validate each string in the array if it's a string array
  if (arr.length > 0 && typeof arr[0] === 'string') {
    (arr as unknown as string[]).forEach((item, index) => {
      if (typeof item === 'string') {
        validateStringLength(item, LIMITS.MAX_DATE_STRING_LENGTH, `${fieldName}[${index}]`);
      }
    });
  }

  return true;
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
