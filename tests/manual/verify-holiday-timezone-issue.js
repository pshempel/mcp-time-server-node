#!/usr/bin/env node
/**
 * Research script to understand the timezone issue with holiday date comparisons
 *
 * Problem: Holiday dates are created without timezone context, causing comparison
 * failures when business dates are parsed with timezone awareness.
 */

const { parseISO, format, isSameDay } = require('date-fns');
const { toDate, formatInTimeZone } = require('date-fns-tz');

console.log('=== Holiday Timezone Issue Research ===\n');

// Simulate the problem
console.log('1. The Problem:');
const holidayDate = new Date(2025, 0, 1); // Jan 1, 2025 in local time
console.log('Holiday created with new Date():', holidayDate.toString());
console.log('Holiday ISO:', holidayDate.toISOString());

const businessDateStr = '2025-01-01';
const businessDateWithTZ = toDate(businessDateStr, { timeZone: 'America/Los_Angeles' });
console.log('\nBusiness date parsed with LA timezone:', businessDateWithTZ.toString());
console.log('Business date ISO:', businessDateWithTZ.toISOString());

console.log('\n2. Comparison using toDateString():');
console.log('Holiday toDateString():', holidayDate.toDateString());
console.log('Business toDateString():', businessDateWithTZ.toDateString());
console.log('Are they equal?', holidayDate.toDateString() === businessDateWithTZ.toDateString());

console.log('\n3. Comparison using isSameDay():');
console.log('isSameDay result:', isSameDay(holidayDate, businessDateWithTZ));

console.log('\n4. The Issue - Different timezone contexts:');
// If the server is in UTC+0 and creates holiday at midnight
const holidayUTC = new Date(Date.UTC(2025, 0, 1));
console.log('Holiday in UTC:', holidayUTC.toISOString());

// But business date in LA timezone at start of day
const businessLA = toDate('2025-01-01T00:00:00', { timeZone: 'America/Los_Angeles' });
console.log('Business in LA:', businessLA.toISOString());
console.log('These represent different moments in time!');

console.log('\n5. Solution approach - ensure holidays are created in same context:');
// Option 1: Create holidays at noon to avoid timezone boundary issues
const holidayNoon = new Date(2025, 0, 1, 12, 0, 0);
console.log('Holiday at noon local:', holidayNoon.toString());

// Option 2: Parse holiday strings with same timezone as business dates
const holidayWithTZ = toDate('2025-01-01', { timeZone: 'America/Los_Angeles' });
console.log('Holiday parsed with LA timezone:', holidayWithTZ.toString());

console.log('\n6. Test different timezones:');
const timezones = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo'];
timezones.forEach((tz) => {
  const date = toDate('2025-01-01', { timeZone: tz });
  console.log(
    `${tz}: ${date.toISOString()} (${formatInTimeZone(date, tz, 'yyyy-MM-dd HH:mm zzz')})`,
  );
});

console.log('\n7. Testing toDateString() reliability across timezones:');
// Create dates representing "same day" in different ways
const date1 = new Date(2025, 0, 1, 0, 0, 0); // Local midnight
const date2 = new Date(2025, 0, 1, 23, 59, 59); // Local end of day
const date3 = toDate('2025-01-01T12:00:00', { timeZone: 'America/Los_Angeles' });
const date4 = toDate('2025-01-01T12:00:00', { timeZone: 'Asia/Tokyo' });

console.log('Local midnight:', date1.toDateString());
console.log('Local end of day:', date2.toDateString());
console.log('LA noon:', date3.toDateString());
console.log('Tokyo noon:', date4.toDateString());
console.log(
  'All show same date string?',
  date1.toDateString() === date2.toDateString() &&
    date2.toDateString() === date3.toDateString() &&
    date3.toDateString() === date4.toDateString(),
);

console.log('\n=== Key Finding ===');
console.log('toDateString() returns the date in the LOCAL timezone of the Date object,');
console.log('regardless of how it was created. This makes it reliable for day comparisons.');
console.log('The issue is that holidays are created without considering the business timezone.');

console.log('\n=== Done ===');
