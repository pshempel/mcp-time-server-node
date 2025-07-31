import { parseISO, differenceInDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { hashCacheKey } from '../cache/cacheKeyHash';
import { cache, CacheTTL } from '../cache/timeCache';
import { TimeServerErrorCodes } from '../types';
import type { NextOccurrenceParams, NextOccurrenceResult } from '../types';
import type { RecurrenceParams } from '../types/recurrence';
import { getConfig } from '../utils/config';
import { validateTimezone, createError, validateDateString } from '../utils/validation';

import { RecurrenceFactory } from './recurrence/RecurrenceFactory';

// Singleton factory instance
const factory = new RecurrenceFactory();

/**
 * Maps NextOccurrenceParams (snake_case) to RecurrenceParams (camelCase)
 */
function mapToRecurrenceParams(params: NextOccurrenceParams): RecurrenceParams {
  const baseParams = {
    pattern: params.pattern,
    timezone: params.timezone,
    time: params.time,
  };

  // Map snake_case to camelCase based on pattern
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
 * Resolves the effective timezone based on our philosophy
 */
function resolveTimezone(paramTimezone: string | undefined, fallback: string): string {
  if (paramTimezone === undefined) {
    return fallback;
  } else if (paramTimezone === '') {
    return 'UTC';
  } else {
    validateTimezone(paramTimezone);
    return paramTimezone;
  }
}

/**
 * Calculate days until the next occurrence
 */
function calculateDaysUntil(nextDate: Date, timezone: string): number {
  const now = new Date();
  const nowZoned = timezone === 'UTC' ? now : toZonedTime(now, timezone);
  const nextZoned = timezone === 'UTC' ? nextDate : toZonedTime(nextDate, timezone);
  const daysUntil = differenceInDays(startOfDay(nextZoned), startOfDay(nowZoned));
  return Math.max(0, daysUntil);
}

/**
 * Generate cache key for nextOccurrence
 */
function getCacheKey(
  params: NextOccurrenceParams,
  fallbackTimezone: string,
  timezone: string,
): string {
  const cacheParams = {
    ...params,
    _configTimezone: fallbackTimezone,
    _resolvedTimezone: timezone,
  };
  return `nextOccurrence:${hashCacheKey(JSON.stringify(cacheParams))}`;
}

/**
 * Calculate the next occurrence and format the result
 */
function calculateNextOccurrence(
  params: NextOccurrenceParams,
  timezone: string,
  cacheKey: string,
): NextOccurrenceResult {
  // Parse start date
  const startFrom = params.start_from ? parseISO(params.start_from) : new Date();
  if (!startFrom || isNaN(startFrom.getTime())) {
    throw createError(TimeServerErrorCodes.INVALID_DATE_FORMAT, 'Invalid start_from date');
  }

  // Map parameters to new format
  const recurrenceParams = mapToRecurrenceParams(params);
  recurrenceParams.timezone = timezone;

  // Calculate next occurrence using factory
  const nextDate = factory.calculate(startFrom, recurrenceParams);

  // Format result
  const result: NextOccurrenceResult = {
    next: nextDate.toISOString(),
    unix: Math.floor(nextDate.getTime() / 1000),
    days_until: calculateDaysUntil(nextDate, timezone),
  };

  // Cache the result
  cache.set(cacheKey, result, CacheTTL.CALCULATIONS);
  return result;
}

/**
 * Handles errors from the calculation, re-throwing validation errors as-is
 */
function handleCalculationError(error: unknown): never {
  // Re-throw validation errors wrapped in { error: ... } format
  if (error && typeof error === 'object' && 'error' in error) {
    throw error;
  }

  // Re-throw our own validation errors
  if (error instanceof Error && 'code' in error) {
    throw error;
  }

  // Wrap other errors
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw createError(
    TimeServerErrorCodes.INTERNAL_ERROR,
    `Failed to calculate next occurrence: ${message}`,
  );
}

/**
 * Calculate the next occurrence of a recurring event
 * Uses RecurrenceFactory for modular pattern handling
 * Maintains backward compatibility with existing API
 */
export function nextOccurrence(params: NextOccurrenceParams): NextOccurrenceResult {
  // Validate string length first
  if (params.start_from && typeof params.start_from === 'string') {
    validateDateString(params.start_from, 'start_from');
  }

  const config = getConfig();
  const fallbackTimezone = config.defaultTimezone;
  const timezone = resolveTimezone(params.timezone, fallbackTimezone);
  const cacheKey = getCacheKey(params, fallbackTimezone, timezone);

  // Check cache
  const cachedResult = cache.get<NextOccurrenceResult>(cacheKey);
  if (cachedResult) return cachedResult;

  try {
    return calculateNextOccurrence(params, timezone, cacheKey);
  } catch (error) {
    handleCalculationError(error);
  }
}
