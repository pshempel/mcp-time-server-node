#!/usr/bin/env npx tsx
/**
 * Research script to verify shared business logic patterns
 * between calculateBusinessHours and getBusinessDays
 */

import { format, isWeekend, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

console.log('=== Business Logic Pattern Analysis ===\n');

// Pattern 1: Date parsing with timezone
console.log('1. DATE PARSING PATTERNS');
console.log('-------------------------');

// Both tools have identical parseDate helpers:
function parseDate_Pattern(dateStr: string, timezone: string): Date {
  // Both use parseTimeInput(dateStr, timezone).date
  // This is the core shared pattern
  console.log(`  Input: "${dateStr}", Timezone: "${timezone}"`);

  // Simulating what parseTimeInput does
  if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = parseISO(dateStr);
    console.log(`  Parsed as: ${date.toISOString()}`);
    return date;
  }

  throw new Error('Invalid date format');
}

try {
  parseDate_Pattern('2025-01-31', 'America/New_York');
  parseDate_Pattern('2025-01-31T10:00:00', 'UTC');
} catch (e) {
  console.log(`  Error: ${e}`);
}

console.log('\n2. WEEKEND DETECTION PATTERNS');
console.log('-------------------------------');

// Pattern in getBusinessDays:
const testDate1 = new Date('2025-01-31'); // Friday
const testDate2 = new Date('2025-02-01'); // Saturday
const testDate3 = new Date('2025-02-02'); // Sunday

console.log('getBusinessDays pattern (uses date-fns isWeekend):');
console.log(`  Friday: isWeekend = ${isWeekend(testDate1)}`);
console.log(`  Saturday: isWeekend = ${isWeekend(testDate2)}`);
console.log(`  Sunday: isWeekend = ${isWeekend(testDate3)}`);

console.log('\ncalculateBusinessHours pattern (manual check):');
// Uses formatInTimeZone to get day of week, then checks 0 or 6
const timezone = 'America/New_York';
for (const date of [testDate1, testDate2, testDate3]) {
  const dayOfWeek = parseInt(formatInTimeZone(date, timezone, 'c'), 10) - 1;
  const isWeekendManual = dayOfWeek === 0 || dayOfWeek === 6;
  const dayName = format(date, 'EEEE');
  console.log(`  ${dayName}: dayOfWeek=${dayOfWeek}, isWeekend=${isWeekendManual}`);
}

console.log('\n3. HOLIDAY PARSING PATTERNS');
console.log('----------------------------');

// Both tools parse holiday arrays similarly but with differences:
console.log('Common pattern:');
console.log('  - Both iterate through holiday arrays');
console.log('  - Both use parseTimeInput(holiday, timezone).date');
console.log('  - Both throw similar errors on invalid dates');

console.log('\nDifferences:');
console.log('  calculateBusinessHours:');
console.log('    - Simple array of date strings');
console.log('    - Stores as Date[] array');
console.log('    - Uses format(h, "yyyy-MM-dd") for comparison');

console.log('\n  getBusinessDays:');
console.log('    - Three sources: holidays[], custom_holidays[], holiday_calendar');
console.log('    - Stores in Set<string> using toDateString()');
console.log('    - Supports observed dates from calendar');
console.log('    - More complex validation for calendar codes');

console.log('\n4. SHARED HELPER PATTERNS');
console.log('--------------------------');

// What could be extracted:
console.log('Extractable shared patterns:');
console.log('  1. parseDate helper - IDENTICAL in both files');
console.log('  2. Holiday date parsing - SIMILAR but with variations');
console.log('  3. Weekend detection - DIFFERENT implementations but same purpose');

console.log('\nNOT shared (tool-specific):');
console.log('  - Business hours validation (only calculateBusinessHours)');
console.log('  - Business hours calculations (only calculateBusinessHours)');
console.log('  - Holiday calendar logic (only getBusinessDays)');
console.log('  - Minute-level calculations (only calculateBusinessHours)');
console.log('  - Day counting logic (only getBusinessDays)');

console.log('\n5. COMPLEXITY ANALYSIS');
console.log('-----------------------');
console.log('calculateBusinessHours complexity:');
console.log('  - Handles time ranges within days');
console.log('  - Accounts for partial business days');
console.log('  - Timezone-aware minute calculations');
console.log('  - Per-day business hours configuration');

console.log('\ngetBusinessDays complexity:');
console.log('  - Simple day counting');
console.log('  - No time-of-day considerations');
console.log('  - Holiday calendar integration');
console.log('  - Observed holiday handling');

console.log('\n=== RECOMMENDATION ===');
console.log('Extract these utilities:');
console.log('1. parseDateWithTimezone(dateStr, timezone, fieldName) - used by both');
console.log('2. parseHolidayDates(dates[], timezone) - basic version, tools can extend');
console.log('3. isBusinessDay(date, options) - unified weekend/holiday checking');
console.log('\nDO NOT extract:');
console.log('- Business hours calculations (too specific to calculateBusinessHours)');
console.log('- Holiday calendar logic (specific to getBusinessDays)');
console.log('- The actual calculation logic (fundamentally different between tools)');
