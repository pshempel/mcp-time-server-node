#!/usr/bin/env node
const { toDate, formatInTimeZone, toZonedTime } = require('date-fns-tz');
const { setHours, setMinutes, format, eachDayOfInterval } = require('date-fns');

console.log('=== Debug Timezone Business Hours Issue ===\n');

// Parse times as Tokyo time
const startStr = '2025-01-21T10:00:00';
const endStr = '2025-01-21T14:00:00';
const timezone = 'Asia/Tokyo';

const startDate = toDate(startStr, { timeZone: timezone });
const endDate = toDate(endStr, { timeZone: timezone });

console.log('Start (Tokyo):', startStr);
console.log('End (Tokyo):', endStr);
console.log('Start (UTC):', startDate.toISOString());
console.log('End (UTC):', endDate.toISOString());

// Get days in interval
const days = eachDayOfInterval({ start: startDate, end: endDate });
console.log('\nDays in interval:', days.length);

days.forEach((day, i) => {
  console.log(`\nDay ${i + 1}:`, format(day, 'yyyy-MM-dd EEEE'));
  console.log('  Day in system TZ:', day.toString());

  // Set business hours in system timezone
  const businessStart = setMinutes(setHours(day, 9), 0);
  const businessEnd = setMinutes(setHours(day, 17), 0);

  console.log('  Business start (system TZ):', businessStart.toString());
  console.log('  Business end (system TZ):', businessEnd.toString());

  // The problem: our start/end dates are in UTC, but business hours are in system TZ
  console.log('  Start date for comparison:', startDate.toString());
  console.log(
    '  Start is within business hours?',
    startDate >= businessStart && startDate <= businessEnd,
  );
});

console.log('\n=== The Fix ===');
console.log('Business hours should be calculated in the business timezone context.');
console.log(
  'We need to convert business hours to UTC for comparison, or work entirely in the business timezone.',
);

console.log('\n=== Done ===');
