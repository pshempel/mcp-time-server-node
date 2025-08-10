import { formatInTimeZone } from 'date-fns-tz';

import { CacheTTL } from '../cache/timeCache';
import type {
  CalculateBusinessHoursParams,
  CalculateBusinessHoursResult,
  BusinessHours,
  WeeklyBusinessHours,
  DayBusinessHours,
} from '../types';
import {
  validateBusinessHoursStructure,
  isWorkDay,
  calculateDayBusinessMinutes,
  buildDayResult,
} from '../utils/businessHoursHelpers';
import { parseDateWithTimezone, parseHolidayDates } from '../utils/businessUtils';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { parseTimeInput } from '../utils/parseTimeInput';
import { resolveTimezone } from '../utils/timezoneUtils';
import {
  validateTimezone,
  validateDateString,
  validateArrayLength,
  LIMITS,
} from '../utils/validation';
import { withCache } from '../utils/withCache';

// Import ErrorCode for MCP SDK compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const { ErrorCode } = require('@modelcontextprotocol/sdk/types.js');

// Default business hours: 9 AM - 5 PM
const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  start: { hour: 9, minute: 0 },
  end: { hour: 17, minute: 0 },
};

function isWeeklyBusinessHours(
  hours: BusinessHours | WeeklyBusinessHours
): hours is WeeklyBusinessHours {
  return typeof hours === 'object' && !('start' in hours);
}

/**
 * Generate array of date strings between start and end dates
 * @internal
 */
export function generateDateRange(startDate: Date, endDate: Date, timezone: string): string[] {
  const datesInBizTz = new Set<string>();
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    datesInBizTz.add(formatInTimeZone(currentDate, timezone, 'yyyy-MM-dd'));
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
  }

  // Always include the end date
  datesInBizTz.add(formatInTimeZone(endDate, timezone, 'yyyy-MM-dd'));

  return Array.from(datesInBizTz).sort();
}

/**
 * Process a single day and calculate business hours
 * @internal
 */
export function processSingleBusinessDay(params: {
  dayDateStr: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  businessHours: BusinessHours | null;
  holidayDates: Date[];
  include_weekends: boolean;
  dayOfWeek: number;
  isWeekend: boolean;
}): {
  dayResult: DayBusinessHours;
  minutes: number;
} {
  const {
    dayDateStr,
    startDate,
    endDate,
    timezone,
    businessHours,
    holidayDates,
    include_weekends,
    dayOfWeek,
    isWeekend,
  } = params;

  // Get day name from day of week
  // eslint-disable-next-line security/detect-object-injection -- dayOfWeek is calculated (0-6), not user input
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    dayOfWeek
  ];

  // Check if this is a work day
  const isWorkingDay = isWorkDay(
    dayDateStr,
    dayOfWeek,
    isWeekend,
    holidayDates,
    include_weekends,
    timezone
  );

  // Log work day decision
  if (!isWorkingDay) {
    const isHolidayDay = holidayDates.some((h) => h.toISOString().slice(0, 10) === dayDateStr);
    debug.decision('Day excluded', {
      date: dayDateStr,
      dayName,
      reason: isHolidayDay ? 'holiday' : isWeekend && !include_weekends ? 'weekend' : 'no-hours',
    });
  }

  let minutes = 0;
  if (isWorkingDay && businessHours) {
    // Create business hours start/end times in business timezone
    const bizStartStr = `${dayDateStr}T${String(businessHours.start.hour).padStart(2, '0')}:${String(businessHours.start.minute).padStart(2, '0')}:00`;
    const bizEndStr = `${dayDateStr}T${String(businessHours.end.hour).padStart(2, '0')}:${String(businessHours.end.minute).padStart(2, '0')}:00`;

    const dayBusinessStart = parseTimeInput(bizStartStr, timezone).date;
    const dayBusinessEnd = parseTimeInput(bizEndStr, timezone).date;

    // Calculate minutes using helper
    minutes = calculateDayBusinessMinutes(
      dayDateStr,
      businessHours,
      dayBusinessStart,
      dayBusinessEnd,
      startDate,
      endDate
    );

    // Log partial day calculations
    if (minutes > 0 && (dayBusinessStart < startDate || dayBusinessEnd > endDate)) {
      debug.decision('Partial day calculated', {
        date: dayDateStr,
        fullDayMinutes:
          (businessHours.end.hour - businessHours.start.hour) * 60 +
          (businessHours.end.minute - businessHours.start.minute),
        actualMinutes: minutes,
        startClamped: dayBusinessStart < startDate,
        endClamped: dayBusinessEnd > endDate,
      });
    }
  }

  // Check if holiday (needed for result structure)
  // Use formatInTimeZone to be consistent with date string generation
  const isHoliday = holidayDates.some(
    (h) => formatInTimeZone(h, timezone, 'yyyy-MM-dd') === dayDateStr
  );

  // Build day result using helper
  const dayResult = buildDayResult(dayDateStr, dayName, minutes, isWeekend, isHoliday);

  return { dayResult, minutes };
}

/**
 * Build the final business hours result from breakdown
 * @internal
 */
export function buildBusinessHoursResult(
  breakdown: DayBusinessHours[],
  totalMinutes: number
): CalculateBusinessHoursResult {
  const result: CalculateBusinessHoursResult = {
    total_business_minutes: totalMinutes,
    total_business_hours: totalMinutes / 60,
    breakdown,
  };

  // Log summary
  debug.business(
    'Calculated %d business hours across %d days (%d working days)',
    Math.round(totalMinutes / 60),
    breakdown.length,
    breakdown.filter((d) => d.business_minutes > 0).length
  );

  return result;
}

export function calculateBusinessHours(
  params: CalculateBusinessHoursParams
): CalculateBusinessHoursResult {
  const { start_time, end_time, holidays = [], include_weekends = false } = params;

  // Log entry with parameters
  debug.business('calculateBusinessHours called with params: %O', {
    start_time,
    end_time,
    timezone: params.timezone,
    business_hours: params.business_hours ?? 'default',
    holidays_count: holidays.length,
    include_weekends,
  });

  // Validate string lengths first
  validateDateString(start_time, 'start_time');
  validateDateString(end_time, 'end_time');
  validateArrayLength(holidays, LIMITS.MAX_ARRAY_LENGTH, 'holidays');

  const config = getConfig();
  const timezone = resolveTimezone(params.timezone, config.defaultTimezone);

  // Generate cache key
  const businessHoursKey = params.business_hours
    ? JSON.stringify(params.business_hours)
    : 'default';
  const cacheKey = `business_hours_${start_time}_${end_time}_${timezone}_${businessHoursKey}_${holidays.join(',')}_${include_weekends}`;

  // Use withCache wrapper instead of manual cache management
  return withCache(cacheKey, CacheTTL.CALCULATIONS, () => {
    // Validate timezone if provided
    if (timezone && !validateTimezone(timezone)) {
      debug.error('Invalid timezone: %s', timezone);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = new Error(`Invalid timezone: ${timezone}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      err.code = ErrorCode.InvalidParams;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      err.data = { timezone, field: 'timezone' };
      throw err;
    }

    // Validate business hours structure using helper
    validateBusinessHoursStructure(params.business_hours);

    // Parse dates
    const startDate = parseDateWithTimezone(start_time, timezone, 'start_time');
    const endDate = parseDateWithTimezone(end_time, timezone, 'end_time');

    // Validate that end is after start
    if (endDate < startDate) {
      debug.error('End time must be after start time: start=%s, end=%s', start_time, end_time);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = new Error('End time must be after start time');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      err.code = ErrorCode.InvalidParams;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      err.data = { start_time, end_time };
      throw err;
    }

    // Log the calculation context
    debug.business(
      'Business hours calculation: %s to %s in %s',
      formatInTimeZone(startDate, timezone, 'yyyy-MM-dd HH:mm'),
      formatInTimeZone(endDate, timezone, 'yyyy-MM-dd HH:mm'),
      timezone
    );

    // Parse holiday dates
    const holidayDates = parseHolidayDates(holidays, timezone);
    if (holidayDates.length > 0) {
      debug.business('Holidays to exclude: %O', holidayDates);
    }

    // Get business hours for a specific day
    const getBusinessHoursForDay = (dayOfWeek: number): BusinessHours | null => {
      if (!params.business_hours) {
        return DEFAULT_BUSINESS_HOURS;
      }

      if (isWeeklyBusinessHours(params.business_hours)) {
        // eslint-disable-next-line security/detect-object-injection -- Day of week index (0-6)
        return params.business_hours[dayOfWeek] ?? DEFAULT_BUSINESS_HOURS;
      }

      return params.business_hours;
    };

    // Generate date range to process
    const dateStrings = generateDateRange(startDate, endDate, timezone);

    // Calculate business hours for each day
    const breakdown: DayBusinessHours[] = [];
    let totalBusinessMinutes = 0;

    for (const dayDateStr of dateStrings) {
      // Get day information
      const day = parseTimeInput(dayDateStr + 'T12:00:00', timezone).date;
      const dayOfWeek = parseInt(formatInTimeZone(day, timezone, 'c'), 10) - 1;
      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

      // Get business hours for this day
      const businessHours = getBusinessHoursForDay(dayOfWeek);

      // Process the single day
      const { dayResult, minutes } = processSingleBusinessDay({
        dayDateStr,
        startDate,
        endDate,
        timezone,
        businessHours,
        holidayDates,
        include_weekends,
        dayOfWeek,
        isWeekend: isWeekendDay,
      });

      breakdown.push(dayResult);
      totalBusinessMinutes += minutes;
    }

    // Build and return the final result
    const result = buildBusinessHoursResult(breakdown, totalBusinessMinutes);

    // Log successful completion
    debug.business(
      'calculateBusinessHours completed successfully: %d total hours',
      result.total_business_hours
    );

    return result;
  });
}
