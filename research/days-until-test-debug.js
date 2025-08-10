#!/usr/bin/env node

const { addDays, differenceInCalendarDays, parseISO } = require('date-fns');

console.log('=== Days Until Test Debug ===\n');

// Simulate what the test is doing
const now = new Date();
console.log('Current time:', now.toISOString());
console.log('Current time (local):', now.toString());

// Test creates date 7 days in future
const futureDate = addDays(now, 7);
console.log('\nFuture date (7 days added):', futureDate.toISOString());
console.log('Future date (local):', futureDate.toString());

// Test converts to date-only string
const dateString = futureDate.toISOString().split('T')[0];
console.log('\nDate string passed to function:', dateString);

// What happens when we parse this date string
const parsedDate = parseISO(dateString);
console.log('\nParsed date:', parsedDate.toISOString());
console.log('Parsed date (local):', parsedDate.toString());

// Calculate difference
const diff = differenceInCalendarDays(parsedDate, now);
console.log('\nCalendar days difference:', diff);

// Let's see why it might be 8 instead of 7
console.log('\n=== Analysis ===');
console.log('Now date component:', now.toISOString().split('T')[0]);
console.log('Future date component:', futureDate.toISOString().split('T')[0]);
console.log(
  'Are dates different?',
  now.toISOString().split('T')[0] !== futureDate.toISOString().split('T')[0],
);

// What if we're near midnight?
const hours = now.getHours();
const utcHours = now.getUTCHours();
console.log('\nLocal hours:', hours);
console.log('UTC hours:', utcHours);
console.log('Timezone offset (hours):', now.getTimezoneOffset() / -60);

// If local time and UTC time are on different days
if (now.toISOString().split('T')[0] !== now.toLocaleDateString('en-CA')) {
  console.log('\nWARNING: Local date and UTC date are different!');
  console.log('Local date:', now.toLocaleDateString('en-CA'));
  console.log('UTC date:', now.toISOString().split('T')[0]);
}
