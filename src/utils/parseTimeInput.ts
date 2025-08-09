import { parseISO, isValid } from 'date-fns';
import { toDate } from 'date-fns-tz';

import { TimeServerErrorCodes } from '../types';

import { debug } from './debug';
import { createError } from './validation';

/**
 * Result of parsing a time input
 */
export interface ParseResult {
  /** The parsed Date object */
  date: Date;
  /** The detected or specified timezone */
  detectedTimezone: string;
  /** Whether the input had explicit timezone information */
  hasExplicitTimezone: boolean;
  /** Offset in minutes if present in input (e.g., +05:00 = 300) */
  offset?: number;
}

/**
 * Checks if a time string contains timezone information
 */
function hasTimezoneInfo(input: string): boolean {
  return input.includes('Z') || /[+-]\d{2}:\d{2}$/.test(input);
}

/**
 * Extracts timezone offset from a string
 * @returns Offset in minutes, or null if no offset found
 */
function extractOffset(input: string): number | null {
  const match = input.match(/([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return sign * (hours * 60 + minutes);
}

/**
 * Parse Unix timestamp string
 */
function parseUnixTimestamp(timeStr: string): ParseResult | null {
  if (!/^\d+$/.test(timeStr)) {
    return null;
  }

  const timestamp = parseInt(timeStr, 10);
  if (isNaN(timestamp)) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid Unix timestamp: ${timeStr}`,
        { input: timeStr }
      ),
    };
  }

  // Heuristic: > 10 digits likely milliseconds (after year 2286)
  const multiplier = timeStr.length > 10 ? 1 : 1000;
  const date = new Date(timestamp * multiplier);

  debug.parsing('Parsed Unix timestamp:', {
    timestamp,
    multiplier,
    result: date.toISOString(),
  });

  return {
    date,
    detectedTimezone: 'UTC',
    hasExplicitTimezone: true,
  };
}

/**
 * Parse ISO string with timezone information
 */
function parseISOWithTimezone(timeStr: string): ParseResult | null {
  if (!hasTimezoneInfo(timeStr)) {
    return null;
  }

  const date = parseISO(timeStr);
  if (!isValid(date)) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid ISO date string: ${timeStr}`,
        { input: timeStr }
      ),
    };
  }

  const offset = extractOffset(timeStr);
  debug.parsing('Parsed ISO with timezone:', {
    input: timeStr,
    hasZ: timeStr.includes('Z'),
    offset,
    result: date.toISOString(),
  });

  return {
    date,
    detectedTimezone: timeStr.includes('Z') ? 'UTC' : 'offset',
    hasExplicitTimezone: true,
    ...(offset !== null && { offset }),
  };
}

/**
 * Parse as local time in specified timezone
 */
function parseLocalTime(timeStr: string, timezone?: string): ParseResult {
  // Apply project convention: "" = UTC, undefined = local
  const effectiveTimezone = timezone === '' ? 'UTC' : timezone;

  let date: Date;
  try {
    if (effectiveTimezone) {
      // Parse as local time in specific timezone
      date = toDate(timeStr, { timeZone: effectiveTimezone });
    } else {
      // Parse as system local time
      date = parseISO(timeStr);
    }
  } catch (error) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Failed to parse date: ${timeStr}`,
        { input: timeStr, timezone, error: String(error) }
      ),
    };
  }

  if (!isValid(date)) {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        `Invalid date format: ${timeStr}`,
        { input: timeStr, timezone }
      ),
    };
  }

  debug.parsing('Parsed local time:', {
    input: timeStr,
    timezone: effectiveTimezone ?? 'local',
    result: date.toISOString(),
  });

  return {
    date,
    detectedTimezone: effectiveTimezone ?? 'local',
    hasExplicitTimezone: false,
  };
}

/**
 * Unified time input parser that handles:
 * - Unix timestamps (seconds and milliseconds)
 * - ISO 8601 strings with/without timezone
 * - Date-only strings
 * - Respects project timezone conventions:
 *   - undefined = system local
 *   - "" = UTC
 *   - string = specific IANA timezone
 *
 * @param input - Time string, Unix timestamp, or number
 * @param timezone - Optional timezone (see conventions above)
 * @returns ParseResult with date and metadata
 * @throws TimeServerErrorCodes.INVALID_DATE_FORMAT for invalid input
 */
export function parseTimeInput(
  input: string | number | undefined | null,
  timezone?: string
): ParseResult {
  debug.parsing('parseTimeInput called with:', { input, timezone });

  // Handle undefined/null/empty
  if (input == null || input === '') {
    throw {
      error: createError(
        TimeServerErrorCodes.INVALID_DATE_FORMAT,
        'Input cannot be null, undefined, or empty',
        { input }
      ),
    };
  }

  // Normalize to string
  const timeStr = String(input);

  // Try parsing strategies in order
  const unixResult = parseUnixTimestamp(timeStr);
  if (unixResult) return unixResult;

  const isoResult = parseISOWithTimezone(timeStr);
  if (isoResult) return isoResult;

  return parseLocalTime(timeStr, timezone);
}
