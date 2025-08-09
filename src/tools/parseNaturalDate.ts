import { 
  addDays, 
  addWeeks, 
  addMonths,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
  setHours,
  setMinutes,
  format
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { ParseNaturalDateParams, ParseNaturalDateResult } from '../types';
import { withCache } from '../utils/withCache';
import { resolveTimezone } from '../utils/timezoneUtils';
import { debug } from '../utils/debug';
import { getNextHoliday } from '../utils/commonHolidays';

const CACHE_TTL = 60 * 1000; // 1 minute cache for parsed dates

function parseNaturalDateImpl(params: ParseNaturalDateParams): ParseNaturalDateResult {
  debug.parse('parseNaturalDate called with: %o', params);
  
  const { input, timezone: userTz, reference_date } = params;
  
  // Validate input
  if (!input || typeof input !== 'string') {
    debug.error('Invalid input: %s', input);
    throw new Error('Input is required and must be a string');
  }
  
  // Resolve timezone (get system timezone as default)
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezone = resolveTimezone(userTz, systemTimezone);
  debug.timezone('Resolved timezone: %s', timezone);
  
  // Validate timezone
  try {
    // Test if timezone is valid by trying to format with it
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
  } catch (e) {
    debug.error('Invalid timezone: %s', timezone);
    throw new Error(`Invalid timezone: ${timezone}`);
  }
  
  // Get reference date
  let referenceDate: Date;
  if (reference_date) {
    referenceDate = new Date(reference_date);
    if (isNaN(referenceDate.getTime())) {
      throw new Error('Invalid reference_date');
    }
  } else {
    referenceDate = new Date();
  }
  
  // Don't convert the reference date - just use it as is
  // The reference date already has the correct time we want to preserve
  debug.timing('Reference date: %s', referenceDate.toISOString());
  
  // Normalize input for matching
  const normalized = input.toLowerCase().trim();
  let resultDate: Date | null = null;
  let interpretation = '';
  
  // Pattern: "next [weekday]"
  const nextWeekdayMatch = normalized.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextWeekdayMatch) {
    const weekday = nextWeekdayMatch[1];
    const weekdayFunctions: Record<string, (date: Date) => Date> = {
      monday: nextMonday,
      tuesday: nextTuesday,
      wednesday: nextWednesday,
      thursday: nextThursday,
      friday: nextFriday,
      saturday: nextSaturday,
      sunday: nextSunday
    };
    
    resultDate = weekdayFunctions[weekday](referenceDate);
    const formatted = format(resultDate, 'MMMM d, yyyy');
    interpretation = `Next ${weekday.charAt(0).toUpperCase() + weekday.slice(1)} (${formatted})`;
  }
  
  // Pattern: "tomorrow"
  else if (normalized === 'tomorrow') {
    resultDate = addDays(referenceDate, 1);
    const formatted = format(resultDate, 'MMMM d, yyyy');
    interpretation = `Tomorrow (${formatted})`;
  }
  
  // Pattern: "yesterday"
  else if (normalized === 'yesterday') {
    resultDate = addDays(referenceDate, -1);
    const formatted = format(resultDate, 'MMMM d, yyyy');
    interpretation = `Yesterday (${formatted})`;
  }
  
  // Pattern: "today"
  else if (normalized === 'today') {
    resultDate = referenceDate;
    const formatted = format(resultDate, 'MMMM d, yyyy');
    interpretation = `Today (${formatted})`;
  }
  
  // Pattern: "in X days"
  else if (/^in\s+\d+\s+days?$/.test(normalized)) {
    const match = normalized.match(/^in\s+(\d+)\s+days?$/);
    const days = parseInt(match![1]);
    resultDate = addDays(referenceDate, days);
    const formatted = format(resultDate, 'MMMM d, yyyy');
    interpretation = `In ${days} day${days === 1 ? '' : 's'} (${formatted})`;
  }
  
  // Pattern: "in X weeks"
  else if (/^in\s+\d+\s+weeks?$/.test(normalized)) {
    const match = normalized.match(/^in\s+(\d+)\s+weeks?$/);
    const weeks = parseInt(match![1]);
    resultDate = addWeeks(referenceDate, weeks);
    const formatted = format(resultDate, 'MMMM d, yyyy');
    interpretation = `In ${weeks} week${weeks === 1 ? '' : 's'} (${formatted})`;
  }
  
  // Pattern: "in X months"
  else if (/^in\s+\d+\s+months?$/.test(normalized)) {
    const match = normalized.match(/^in\s+(\d+)\s+months?$/);
    const months = parseInt(match![1]);
    resultDate = addMonths(referenceDate, months);
    const formatted = format(resultDate, 'MMMM d, yyyy');
    interpretation = `In ${months} month${months === 1 ? '' : 's'} (${formatted})`;
  }
  
  // Pattern: Check for holidays
  else if (!resultDate) {
    // Try to parse as a holiday
    const holidayDate = getNextHoliday(normalized, referenceDate);
    if (holidayDate) {
      resultDate = holidayDate;
      const formatted = format(resultDate, 'MMMM d, yyyy');
      const holidayName = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      interpretation = `${holidayName} (${formatted})`;
    }
  }
  
  // Pattern: "[day] at [time]" (e.g., "tomorrow at 3pm", "next Tuesday at 2:30pm")
  if (!resultDate) {
    // First try to extract the day part and time part
    const atMatch = normalized.match(/^(.+?)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
    if (atMatch) {
      const dayPart = atMatch[1];
      let hour = parseInt(atMatch[2]);
      const minute = parseInt(atMatch[3] || '0');
      const meridiem = atMatch[4];
      
      // Parse the day part recursively
      const dayResult = parseNaturalDateImpl({ 
        input: dayPart, 
        timezone,
        reference_date
      });
      
      // Adjust hour for AM/PM
      if (meridiem === 'pm' && hour < 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;
      
      // Set the time on the parsed date
      // When working with UTC, we need to preserve the intended time
      const dayDate = new Date(dayResult.parsed_date);
      if (timezone === 'UTC') {
        dayDate.setUTCHours(hour, minute, 0, 0);
        resultDate = dayDate;
      } else {
        resultDate = setMinutes(setHours(dayDate, hour), minute);
      }
      
      // Format time for interpretation
      const timeStr = meridiem 
        ? `${atMatch[2]}${atMatch[3] ? ':' + atMatch[3] : ':00'} ${meridiem.toUpperCase()}`
        : `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Get the day interpretation without the date
      const dayInterpretation = dayResult.interpretation.split(' (')[0];
      const formatted = format(resultDate, 'MMMM d, yyyy');
      
      // Add timezone if not UTC
      if (timezone !== 'UTC') {
        const tzAbbr = formatInTimeZone(resultDate, timezone, 'zzz');
        interpretation = `${dayInterpretation} at ${timeStr} ${tzAbbr} (${formatted})`;
      } else {
        interpretation = `${dayInterpretation} at ${timeStr} (${formatted})`;
      }
    }
  }
  
  // If no pattern matched
  if (!resultDate) {
    debug.error('Could not parse: %s', input);
    // Return a helpful error message instead of throwing
    throw new Error(`Unable to parse "${input}". Supported patterns: tomorrow, yesterday, today, next [weekday], in X days/weeks/months, or times like "tomorrow at 3pm". For holidays like "Christmas", please use the date directly (e.g., "December 25" or "2025-12-25").`);
  }
  
  // Format the result in the target timezone
  // Use 'X' for UTC to get 'Z' instead of '+00:00'
  const formatString = timezone === 'UTC' ? "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'" : "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";
  const formattedResult = formatInTimeZone(resultDate, timezone, formatString);
  
  // Add timezone abbreviation to interpretation if not UTC (but not if already present)
  if (timezone !== 'UTC' && !interpretation.includes(' EST') && !interpretation.includes(' PST') && !interpretation.includes(' CST')) {
    const tzAbbr = formatInTimeZone(resultDate, timezone, 'zzz');
    interpretation = interpretation.replace(/\)$/, ` ${tzAbbr})`);
  }
  
  debug.parse('Parsed "%s" to %s', input, formattedResult);
  
  return {
    parsed_date: formattedResult,
    interpretation,
    timezone_used: timezone
  };
}

export function parseNaturalDate(params: ParseNaturalDateParams): ParseNaturalDateResult {
  // Build cache key from params
  const cacheKey = `parseNaturalDate_${params.input}_${params.timezone || 'default'}_${params.reference_date || 'now'}`;
  
  return withCache(cacheKey, CACHE_TTL, () => parseNaturalDateImpl(params));
}