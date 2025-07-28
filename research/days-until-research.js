#!/usr/bin/env node

const {
  differenceInDays,
  differenceInCalendarDays,
  startOfDay,
  parseISO,
  format,
} = require('date-fns');
const { toZonedTime, formatInTimeZone } = require('date-fns-tz');

console.log('=== Researching days_until calculations ===\n');

// Test dates
const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);

const nextWeek = new Date(now);
nextWeek.setDate(nextWeek.getDate() + 7);

const christmas2025 = new Date(2025, 11, 25); // Dec 25, 2025

console.log('Current time:', now.toISOString());
console.log('Tomorrow:', tomorrow.toISOString());
console.log('Next week:', nextWeek.toISOString());
console.log('Christmas 2025:', christmas2025.toISOString());

console.log('\n=== differenceInDays vs differenceInCalendarDays ===');

// differenceInDays - exact 24-hour periods
console.log('\ndifferenceInDays (exact 24-hour periods):');
console.log('To tomorrow:', differenceInDays(tomorrow, now));
console.log('To next week:', differenceInDays(nextWeek, now));
console.log('To Christmas 2025:', differenceInDays(christmas2025, now));

// differenceInCalendarDays - calendar days (ignores time)
console.log('\ndifferenceInCalendarDays (calendar days):');
console.log('To tomorrow:', differenceInCalendarDays(tomorrow, now));
console.log('To next week:', differenceInCalendarDays(nextWeek, now));
console.log('To Christmas 2025:', differenceInCalendarDays(christmas2025, now));

console.log('\n=== Edge case: same day, different times ===');
const today9am = new Date(now);
today9am.setHours(9, 0, 0, 0);
const today5pm = new Date(now);
today5pm.setHours(17, 0, 0, 0);

console.log('9am:', today9am.toISOString());
console.log('5pm:', today5pm.toISOString());
console.log('differenceInDays:', differenceInDays(today5pm, today9am));
console.log('differenceInCalendarDays:', differenceInCalendarDays(today5pm, today9am));

console.log('\n=== Timezone considerations ===');
const nyTimezone = 'America/New_York';
const tokyoTimezone = 'Asia/Tokyo';

// Event at midnight in different timezones
const eventDateNY = '2025-07-04'; // July 4th
const eventDateUTC = parseISO(eventDateNY + 'T00:00:00Z');
const eventDateNYMidnight = parseISO(eventDateNY + 'T00:00:00-04:00'); // EDT

console.log('\nEvent: July 4, 2025');
console.log('UTC interpretation:', eventDateUTC.toISOString());
console.log('NY midnight:', eventDateNYMidnight.toISOString());

const nowNY = toZonedTime(now, nyTimezone);
const eventNY = toZonedTime(eventDateNYMidnight, nyTimezone);

console.log('\nDays until (from now):');
console.log('To UTC date:', differenceInCalendarDays(eventDateUTC, now));
console.log('To NY midnight:', differenceInCalendarDays(eventDateNYMidnight, now));

console.log('\n=== Negative values (past events) ===');
const lastChristmas = new Date(2024, 11, 25);
console.log('\nDays since last Christmas:', differenceInCalendarDays(lastChristmas, now));
console.log('(negative = in the past)');

console.log('\n=== Include time option ===');
// For more precise calculations
const event = new Date(now);
event.setDate(event.getDate() + 2);
event.setHours(14, 30, 0, 0); // 2 days from now at 2:30 PM

const daysExact = differenceInDays(event, now);
const daysCal = differenceInCalendarDays(event, now);
const hoursTotal = (event - now) / (1000 * 60 * 60);

console.log('\nEvent in ~2.5 days:');
console.log('Exact days:', daysExact);
console.log('Calendar days:', daysCal);
console.log('Total hours:', hoursTotal.toFixed(1));

console.log('\n=== Formatting options ===');
const daysUntil = differenceInCalendarDays(christmas2025, now);
console.log('\nDays until Christmas 2025:', daysUntil);
console.log('Formatted: "' + daysUntil + ' days"');
console.log('Formatted: "in ' + daysUntil + ' days"');
console.log('Formatted: "' + daysUntil + ' days remaining"');

// Smart formatting
if (daysUntil === 0) {
  console.log('Smart: "Today"');
} else if (daysUntil === 1) {
  console.log('Smart: "Tomorrow"');
} else if (daysUntil === -1) {
  console.log('Smart: "Yesterday"');
} else if (daysUntil > 0) {
  console.log('Smart: "in ' + daysUntil + ' days"');
} else {
  console.log('Smart: "' + Math.abs(daysUntil) + ' days ago"');
}

console.log('\n=== End of research ===');
