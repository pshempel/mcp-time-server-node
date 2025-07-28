#!/usr/bin/env node
/**
 * Debug the holiday timezone issue
 */

const { toDate } = require('date-fns-tz');
const { getHolidaysForYear } = require('../../dist/data/holidays');

console.log('=== Debug Holiday Timezone Issue ===\n');

// What getBusinessDays does
const start_date = '2025-01-01';
const timezone = 'America/Los_Angeles';

// Parse business date with timezone
const businessDate = toDate(start_date, { timeZone: timezone });
console.log('Business date parsed with LA timezone:');
console.log('- toString():', businessDate.toString());
console.log('- toISOString():', businessDate.toISOString());
console.log('- toDateString():', businessDate.toDateString());

// Get holidays for US
const holidays = getHolidaysForYear('US', 2025);
const newYears = holidays.find((h) => h.name === "New Year's Day");

if (newYears) {
  console.log('\nNew Years holiday from data:');
  console.log('- toString():', newYears.date.toString());
  console.log('- toISOString():', newYears.date.toISOString());
  console.log('- toDateString():', newYears.date.toDateString());

  console.log('\nComparison:');
  console.log('- businessDate >= newYears.date:', businessDate >= newYears.date);
  console.log('- businessDate <= newYears.date:', businessDate <= newYears.date);
  console.log(
    '- toDateString() equal:',
    businessDate.toDateString() === newYears.date.toDateString(),
  );
}

// Simulate what happens in the loop
console.log('\nIn getBusinessDays, holidays are checked like this:');
console.log('if (dateToUse >= startDate && dateToUse <= endDate)');
console.log('Where startDate and endDate are the parsed business dates');

console.log('\n=== Done ===');
