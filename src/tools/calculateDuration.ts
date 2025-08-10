import { differenceInMilliseconds } from 'date-fns';

import { ValidationError, TimezoneError, DateParsingError } from '../adapters/mcp-sdk';
import { CacheTTL } from '../cache/timeCache';
import type { CalculateDurationParams, CalculateDurationResult } from '../types';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { parseTimeInput } from '../utils/parseTimeInput';
import { resolveTimezone as resolveTimezoneUtil } from '../utils/timezoneUtils';
import { validateTimezone, validateDateString } from '../utils/validation';
import { withCache } from '../utils/withCache';

const validUnits = ['auto', 'milliseconds', 'seconds', 'minutes', 'hours', 'days'];

export function calculateDuration(params: CalculateDurationParams): CalculateDurationResult {
  debug.timing('calculateDuration called with params: %O', params);
  const { start_time, end_time } = params;

  // Validate string lengths first
  if (typeof start_time === 'string') {
    validateDateString(start_time, 'start_time');
  }
  if (typeof end_time === 'string') {
    validateDateString(end_time, 'end_time');
  }

  const config = getConfig();
  const unit = validateUnit(params.unit);
  const timezone = resolveTimezoneUtil(params.timezone, config.defaultTimezone);

  // Use withCache wrapper instead of manual cache management
  return withCache(
    `duration_${start_time}_${end_time}_${unit}_${timezone}`,
    CacheTTL.CALCULATIONS,
    () => {
      // Validate timezone
      if (!validateTimezone(timezone)) {
        debug.error('Invalid timezone: %s', timezone);
        throw new TimezoneError(`Invalid timezone: ${timezone}`, timezone);
      }

      // Parse dates with proper error context
      const startDate = parseDateWithContext(start_time, timezone, 'start_time');
      debug.timing('Parsed start date: %s', startDate.toISOString());

      const endDate = parseDateWithContext(end_time, timezone, 'end_time');
      debug.timing('Parsed end date: %s', endDate.toISOString());

      // Calculate all duration values
      const values = calculateDurationValues(startDate, endDate);
      debug.timing('Duration in milliseconds: %d', values.milliseconds);

      // Format the result
      const formatted = formatDurationResult(values, unit);
      debug.timing('Formatted duration: %s', formatted);

      const result: CalculateDurationResult = {
        ...values,
        formatted,
      };

      debug.timing('Returning result: %O', result);
      return result;
    }
  );
}

/**
 * Time components for duration formatting
 */
interface TimeComponents {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Pluralize a time unit based on value
 */
export function pluralize(value: number, singular: string): string {
  return `${value} ${value === 1 ? singular : singular + 's'}`;
}

/**
 * Add a time unit to the parts array if value > 0
 */
export function addTimeUnit(parts: string[], value: number, unit: string): void {
  if (value > 0) {
    parts.push(pluralize(value, unit));
  }
}

/**
 * Calculate time components from total seconds
 */
export function calculateTimeComponents(totalSeconds: number): TimeComponents {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

/**
 * Validate and resolve unit parameter
 */
export function validateUnit(unit: string | undefined): string {
  debug.validation('validateUnit called with: %s', unit);
  const resolved = unit ?? 'auto';

  if (!validUnits.includes(resolved)) {
    debug.validation('Invalid unit detected: %s', resolved);
    debug.error('Invalid unit: %s', resolved);
    throw new ValidationError(
      `Invalid unit: ${resolved}. Must be one of: ${validUnits.join(', ')}`,
      { unit: resolved }
    );
  }

  debug.validation('Resolved unit: %s', resolved);
  return resolved;
}

/**
 * Parse date with proper error context
 */
function parseDateWithContext(time: string, timezone: string, paramName: string): Date {
  debug.parse(
    'parseDateWithContext called for %s: time=%s, timezone=%s',
    paramName,
    time,
    timezone
  );

  try {
    const result = parseTimeParameter(time, timezone);
    debug.parse('%s parsed successfully: %s', paramName, result.toISOString());
    return result;
  } catch (error) {
    debug.parse('Failed to parse %s: %s', paramName, error);
    debug.error('Failed to parse %s: %s', paramName, error);
    throw new DateParsingError(`Invalid ${paramName} format: ${time}`, { [paramName]: time });
  }
}

/**
 * Parse time parameter with timezone awareness using the centralized parser
 */
export function parseTimeParameter(time: string, timezone: string): Date {
  debug.parse('parseTimeParameter called with: time=%s, timezone=%s', time, timezone);

  try {
    const result = parseTimeInput(time, timezone);
    debug.parse('parseTimeParameter returning: %s', result.date.toISOString());
    return result.date;
  } catch (error) {
    debug.parse('Parse error: %s', error);
    debug.error('Parse error: %s', error);
    throw new DateParsingError(`Invalid date format: ${time}`, { time, timezone });
  }
}

/**
 * Duration values interface
 */
interface DurationValues {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  is_negative: boolean;
}

/**
 * Calculate all duration values from start and end dates
 */
export function calculateDurationValues(startDate: Date, endDate: Date): DurationValues {
  debug.timing(
    'calculateDurationValues called with: start=%s, end=%s',
    startDate.toISOString(),
    endDate.toISOString()
  );

  const milliseconds = differenceInMilliseconds(endDate, startDate);
  const seconds = milliseconds / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const is_negative = milliseconds < 0;

  const result = {
    milliseconds,
    seconds,
    minutes,
    hours,
    days,
    is_negative,
  };

  debug.timing('Calculated duration values: %O', result);
  return result;
}

/**
 * Format duration result based on unit parameter
 */
export function formatDurationResult(values: DurationValues, unit: string): string {
  debug.timing('formatDurationResult called with: unit=%s, values=%O', unit, values);

  let formatted: string;

  if (unit !== 'auto' && unit !== 'milliseconds') {
    // Specific unit requested
    const value =
      unit === 'seconds'
        ? values.seconds
        : unit === 'minutes'
          ? values.minutes
          : unit === 'hours'
            ? values.hours
            : values.days;
    formatted = `${value} ${unit}`;
  } else if (unit === 'milliseconds') {
    formatted = `${values.milliseconds} milliseconds`;
  } else {
    // Auto format - use existing formatDuration helper
    formatted = formatDuration(values.milliseconds);
  }

  debug.timing('Formatted result: %s', formatted);
  return formatted;
}

/**
 * Format duration in human-readable format
 */
function formatDuration(milliseconds: number): string {
  debug.timing('formatDuration called with: %d ms', milliseconds);
  const abs = Math.abs(milliseconds);
  const negative = milliseconds < 0;

  if (abs === 0) {
    debug.timing('Zero duration, returning "0 seconds"');
    return '0 seconds';
  }

  const totalSeconds = Math.floor(abs / 1000);
  const components = calculateTimeComponents(totalSeconds);
  debug.timing('Time components: %O', components);

  const parts: string[] = [];
  addTimeUnit(parts, components.days, 'day');
  addTimeUnit(parts, components.hours, 'hour');
  addTimeUnit(parts, components.minutes, 'minute');
  // Always include seconds if no other units
  if (components.seconds > 0 || parts.length === 0) {
    parts.push(pluralize(components.seconds, 'second'));
  }

  const formatted = parts.join(' ');
  const result = negative ? `-${formatted}` : formatted;
  debug.timing('Formatted duration: %s', result);
  return result;
}
