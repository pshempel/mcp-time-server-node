import { differenceInCalendarDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// SDK 1.17.2 export issue workaround
const path = require('path');
const sdkPath = path.resolve(__dirname, '../../node_modules/@modelcontextprotocol/sdk/dist/cjs/types');
const { ErrorCode } = require(sdkPath);

import { CacheTTL } from '../cache/timeCache';
import type { DaysUntilParams, DaysUntilResult } from '../types';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { parseTimeInput } from '../utils/parseTimeInput';
import { resolveTimezone as resolveTimezoneUtil } from '../utils/timezoneUtils';
import { validateTimezone, validateStringLength, LIMITS } from '../utils/validation';
import { withCache } from '../utils/withCache';

/**
 * Parse target date from various formats
 */
export function parseTargetDate(target_date: string | number, timezone?: string): Date {
  // Convert to string first for parseTimeInput
  const input = String(target_date);
  return parseTimeInput(input, timezone).date;
}

/**
 * Convert date to specified timezone
 */
export function convertToTimezone(date: Date, timezone: string): Date {
  return timezone === 'UTC' ? date : toZonedTime(date, timezone);
}

/**
 * Format days until as human-readable string
 */
export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/**
 * Get appropriate cache TTL based on days until
 */
export function getCacheTTL(daysUntil: number): number {
  return Math.abs(daysUntil) === 0 ? CacheTTL.CURRENT_TIME : CacheTTL.CALCULATIONS;
}

/**
 * Calculate days until a target date
 * @param params - The parameters for the calculation
 * @returns Number of days or formatted string
 */
// eslint-disable-next-line max-lines-per-function
export function daysUntil(params: DaysUntilParams): DaysUntilResult {
  debug.timing('daysUntil called with params: %O', params);
  // Validate required parameter
  if (!params.target_date) {
    debug.error('target_date is required');
    const err: any = new Error('target_date is required');
    err.code = ErrorCode.InvalidParams;
    err.data = { field: 'target_date' };
    throw err;
  }

  // Validate string length first (general limit for very long strings)
  if (typeof params.target_date === 'string') {
    validateStringLength(params.target_date, LIMITS.MAX_STRING_LENGTH, 'target_date');
  }

  const { target_date, timezone: userTimezone, format_result = false } = params;
  const { defaultTimezone } = getConfig();
  const timezone = resolveTimezoneUtil(userTimezone, defaultTimezone);
  debug.timezone('Resolved timezone: %s', timezone);

  // Use withCache wrapper with CacheTTL.CALCULATIONS (since TTL depends on result)
  return withCache(
    `days_until:${target_date}:${timezone}:${format_result}`,
    CacheTTL.CALCULATIONS,
    () => {
      // Validate timezone if provided
      if (userTimezone !== undefined && !validateTimezone(timezone)) {
        debug.error('Invalid timezone: %s', timezone);
        const err: any = new Error(`Invalid timezone: ${timezone}`);
        err.code = ErrorCode.InvalidParams;
        err.data = { timezone, field: 'timezone' };
        throw err;
      }

      // Parse target date
      let targetDate: Date;
      debug.parse('Parsing target_date: %s', target_date);
      try {
        targetDate = parseTargetDate(target_date, timezone);
        debug.parse('Parsed date: %s', targetDate.toISOString());
      } catch (error) {
        debug.error('Invalid target_date format: %s, error: %s', target_date, error instanceof Error ? error.message : String(error));
        const err: any = new Error(`Invalid target_date format: ${target_date}`);
        err.code = ErrorCode.InvalidParams;
        err.data = {
          target_date,
          error: error instanceof Error ? error.message : String(error),
          field: 'target_date'
        };
        throw err;
      }

      // Get current date in the specified timezone
      const now = new Date();
      debug.timing('Current time: %s', now.toISOString());

      // Convert both dates to the specified timezone for calendar day comparison
      const nowInTimezone = convertToTimezone(now, timezone);
      const targetInTimezone = convertToTimezone(targetDate, timezone);
      debug.timezone('Now in timezone: %s', nowInTimezone.toISOString());
      debug.timezone('Target in timezone: %s', targetInTimezone.toISOString());

      // Calculate calendar days difference
      const daysUntil = differenceInCalendarDays(targetInTimezone, nowInTimezone);
      debug.timing('Days until: %d', daysUntil);

      let result: DaysUntilResult;

      if (format_result) {
        // Format the result as a human-readable string
        result = formatDaysUntil(daysUntil);
        debug.timing('Formatted result: %s', result);
      } else {
        // Return just the number
        result = daysUntil;
      }

      return result;
    }
  );
}
