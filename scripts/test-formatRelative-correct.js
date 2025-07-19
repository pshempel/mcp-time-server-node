const { parseISO, differenceInCalendarDays, startOfDay } = require('date-fns');
const { formatInTimeZone } = require('date-fns-tz');

// Correct implementation of timezone-aware relative formatting
function formatRelativeInTimezone(date, baseDate, timezone) {
  // Format the time in the target timezone
  const timeStr = formatInTimeZone(date, timezone, 'h:mm a');
  const dayOfWeek = formatInTimeZone(date, timezone, 'EEEE');

  // Get start of day for both dates in UTC for accurate day counting
  const dateStartUTC = startOfDay(date);
  const baseStartUTC = startOfDay(baseDate);

  // Calculate calendar days difference
  const daysDiff = differenceInCalendarDays(dateStartUTC, baseStartUTC);

  // Build the relative string
  if (daysDiff === 0) {
    return `today at ${timeStr}`;
  } else if (daysDiff === -1) {
    return `yesterday at ${timeStr}`;
  } else if (daysDiff === 1) {
    return `tomorrow at ${timeStr}`;
  } else if (daysDiff >= -6 && daysDiff < -1) {
    return `last ${dayOfWeek} at ${timeStr}`;
  } else if (daysDiff > 1 && daysDiff < 7) {
    return `${dayOfWeek} at ${timeStr}`;
  } else {
    // For dates beyond a week, return the date
    return formatInTimeZone(date, timezone, 'MM/dd/yyyy');
  }
}

// Test with the problematic case
const testDate = parseISO('2024-01-01T09:30:00.000Z');
const baseDate = parseISO('2024-01-03T14:00:00.000Z');

console.log('Test Date:', testDate.toISOString());
console.log('Base Date:', baseDate.toISOString());
console.log('');

// Test in different timezones
const timezones = ['America/New_York', 'Asia/Tokyo', 'UTC'];

timezones.forEach((tz) => {
  console.log(`\nTimezone: ${tz}`);
  const result = formatRelativeInTimezone(testDate, baseDate, tz);
  console.log('Result:', result);

  // Show what time it actually is in that timezone
  const actualTime = formatInTimeZone(testDate, tz, "EEEE, MMMM do, yyyy 'at' h:mm a zzz");
  console.log('Actual time:', actualTime);
});

// Test edge cases
console.log('\n=== Edge Cases ===');

const edgeCases = [
  { desc: 'Same day', date: '2024-01-03T09:00:00Z', base: '2024-01-03T14:00:00Z' },
  { desc: 'Yesterday', date: '2024-01-02T09:00:00Z', base: '2024-01-03T14:00:00Z' },
  { desc: 'Tomorrow', date: '2024-01-04T09:00:00Z', base: '2024-01-03T14:00:00Z' },
  { desc: '6 days ago', date: '2023-12-28T09:00:00Z', base: '2024-01-03T14:00:00Z' },
  { desc: '7 days ago', date: '2023-12-27T09:00:00Z', base: '2024-01-03T14:00:00Z' },
  { desc: '6 days ahead', date: '2024-01-09T09:00:00Z', base: '2024-01-03T14:00:00Z' },
  { desc: '7 days ahead', date: '2024-01-10T09:00:00Z', base: '2024-01-03T14:00:00Z' },
];

edgeCases.forEach(({ desc, date, base }) => {
  console.log(`\n${desc}:`);
  const d = parseISO(date);
  const b = parseISO(base);

  timezones.forEach((tz) => {
    const result = formatRelativeInTimezone(d, b, tz);
    console.log(`  ${tz}: ${result}`);
  });
});

// Test with current date as base
console.log('\n=== Using current date as base ===');
const now = new Date();
const testDates = [
  new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
  now, // today
  new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
  new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days ahead
];

testDates.forEach((date) => {
  console.log(`\nDate: ${date.toISOString()}`);
  timezones.forEach((tz) => {
    const result = formatRelativeInTimezone(date, now, tz);
    console.log(`  ${tz}: ${result}`);
  });
});
