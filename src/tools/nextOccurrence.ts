import { differenceInDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// SDK 1.17.2 export issue workaround
const path = require('path');
const sdkPath = path.resolve(__dirname, '../../node_modules/@modelcontextprotocol/sdk/dist/cjs/types');
const { ErrorCode } = require(sdkPath);

import { CacheTTL } from '../cache/timeCache';
import type { NextOccurrenceParams, NextOccurrenceResult } from '../types';
import type { RecurrenceParams } from '../types/recurrence';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { parseTimeInput } from '../utils/parseTimeInput';
import { resolveTimezone } from '../utils/timezoneUtils';
import { validateTimezone, validateDateString } from '../utils/validation';
import { withCache } from '../utils/withCache';

import { RecurrenceFactory } from './recurrence/RecurrenceFactory';

// Singleton factory instance
const factory = new RecurrenceFactory();

/**
 * Maps NextOccurrenceParams (snake_case) to RecurrenceParams (camelCase)
 */
function mapToRecurrenceParams(params: NextOccurrenceParams): RecurrenceParams {
  debug.recurrence('mapToRecurrenceParams called with pattern: %s', params.pattern);
  const baseParams = {
    pattern: params.pattern,
    timezone: params.timezone,
    time: params.time,
  };

  // Map snake_case to camelCase based on pattern
  debug.recurrence('Mapping parameters for pattern: %s', params.pattern);
  switch (params.pattern) {
    case 'weekly':
      return {
        ...baseParams,
        pattern: 'weekly',
        dayOfWeek: params.day_of_week,
      };
    case 'monthly':
      return {
        ...baseParams,
        pattern: 'monthly',
        dayOfMonth: params.day_of_month as number,
      };
    case 'yearly':
      return {
        ...baseParams,
        pattern: 'yearly',
      };
    case 'daily':
      return {
        ...baseParams,
        pattern: 'daily',
      };
    default:
      // Let the validator handle invalid patterns
      return baseParams as RecurrenceParams;
  }
}

/**
 * Calculate days until the next occurrence
 */
function calculateDaysUntil(nextDate: Date, timezone: string): number {
  debug.recurrence(
    'calculateDaysUntil called with nextDate: %s, timezone: %s',
    nextDate.toISOString(),
    timezone
  );
  const now = new Date();
  const nowZoned = timezone === 'UTC' ? now : toZonedTime(now, timezone);
  const nextZoned = timezone === 'UTC' ? nextDate : toZonedTime(nextDate, timezone);
  const daysUntil = differenceInDays(startOfDay(nextZoned), startOfDay(nowZoned));
  debug.recurrence('Days until next occurrence: %d', daysUntil);
  return Math.max(0, daysUntil);
}

/**
 * Generate cache key for nextOccurrence
 * Note: Now only used for generating the raw cache key for withCache
 */
function getCacheKey(
  params: NextOccurrenceParams,
  fallbackTimezone: string,
  timezone: string
): string {
  const cacheParams = {
    ...params,
    _configTimezone: fallbackTimezone,
    _resolvedTimezone: timezone,
  };
  return `nextOccurrence:${JSON.stringify(cacheParams)}`;
}

/**
 * Calculate the next occurrence and format the result
 */
function calculateNextOccurrence(
  params: NextOccurrenceParams,
  timezone: string
): NextOccurrenceResult {
  debug.recurrence('calculateNextOccurrence called with params: %O', params);
  // Parse start date
  let startFrom: Date;
  if (params.start_from) {
    debug.parse('Parsing start_from: %s', params.start_from);
    try {
      startFrom = parseTimeInput(params.start_from, timezone).date;
      debug.parse('Parsed start_from date: %s', startFrom.toISOString());
    } catch (error) {
      debug.error('Invalid start_from date: %s', params.start_from);
      const err: any = new Error('Invalid start_from date');
      err.code = ErrorCode.InvalidParams;
      err.data = { start_from: params.start_from };
      throw err;
    }
  } else {
    startFrom = new Date();
  }

  // Map parameters to new format
  const recurrenceParams = mapToRecurrenceParams(params);
  recurrenceParams.timezone = timezone;

  // Calculate next occurrence using factory
  debug.recurrence('Calculating next occurrence with factory');
  const nextDate = factory.calculate(startFrom, recurrenceParams);
  debug.recurrence('Next occurrence date: %s', nextDate.toISOString());

  // Format result
  const result: NextOccurrenceResult = {
    next: nextDate.toISOString(),
    unix: Math.floor(nextDate.getTime() / 1000),
    days_until: calculateDaysUntil(nextDate, timezone),
  };

  return result;
}

/**
 * Handles errors from the calculation, re-throwing validation errors as-is
 */
function handleCalculationError(error: unknown): never {
  // Re-throw validation errors that already have error code
  if (error instanceof Error && 'code' in error) {
    throw error;
  }

  // Wrap other errors
  const message = error instanceof Error ? error.message : 'Unknown error';
  debug.error('Failed to calculate next occurrence: %s', message);
  const err: any = new Error(`Failed to calculate next occurrence: ${message}`);
  err.code = ErrorCode.InternalError;
  err.data = {};
  throw err;
}

/**
 * Calculate the next occurrence of a recurring event
 * Uses RecurrenceFactory for modular pattern handling
 * Maintains backward compatibility with existing API
 */
export function nextOccurrence(params: NextOccurrenceParams): NextOccurrenceResult {
  debug.recurrence('nextOccurrence called with params: %O', params);
  // Validate string length first
  if (params.start_from && typeof params.start_from === 'string') {
    validateDateString(params.start_from, 'start_from');
  }

  const config = getConfig();
  const fallbackTimezone = config.defaultTimezone;
  const timezone = resolveTimezone(params.timezone, fallbackTimezone);

  // Validate timezone if provided
  if (params.timezone) {
    debug.validation('Validating timezone: %s', timezone);
    if (!validateTimezone(timezone)) {
      debug.error('Invalid timezone: %s', timezone);
      const err: any = new Error(`Invalid timezone: ${timezone}`);
      err.code = ErrorCode.InvalidParams;
      err.data = { timezone };
      throw err;
    }
  }
  const cacheKey = getCacheKey(params, fallbackTimezone, timezone);

  // Use withCache wrapper instead of manual cache management
  return withCache(cacheKey, CacheTTL.CALCULATIONS, () => {
    try {
      const result = calculateNextOccurrence(params, timezone);
      debug.recurrence('nextOccurrence returning: %O', result);
      return result;
    } catch (error) {
      handleCalculationError(error);
    }
  });
}
