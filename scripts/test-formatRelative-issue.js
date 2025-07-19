const { formatRelative, parseISO } = require('date-fns');
const { toDate, formatInTimeZone } = require('date-fns-tz');

console.log('Debugging formatRelative timezone issue\n');

// The problematic date from the test
const dateStr = '2024-01-01T09:30:00.000Z';
const date = parseISO(dateStr);

// Current time (for testing)
const now = new Date();

console.log('Test Date:', date.toISOString());
console.log('Current Date:', now.toISOString());
console.log('');

// Test the current implementation approach
console.log('=== Current Implementation Approach ===');
function currentImplementation(timezone) {
  console.log(`\nTimezone: ${timezone}`);

  // This is what the current code does
  const zonedDate = toDate(date, { timeZone: timezone });
  const zonedNow = toDate(now, { timeZone: timezone });

  console.log('Step 1 - toDate results:');
  console.log('  zonedDate:', zonedDate.toISOString());
  console.log('  zonedNow:', zonedNow.toISOString());
  console.log('  Are they the same as original?', zonedDate.toISOString() === date.toISOString());

  // Calculate time difference
  const timeDiff = zonedDate.getTime() - zonedNow.getTime();
  console.log('\nStep 2 - Time difference:', timeDiff, 'ms');

  // Create adjusted date
  const adjustedDate = new Date(Date.now() + timeDiff);
  console.log('\nStep 3 - Adjusted date:', adjustedDate.toISOString());

  // Format relative
  const result = formatRelative(adjustedDate, new Date());
  console.log('\nStep 4 - formatRelative result:', result);

  // What it should show
  const correctTime = formatInTimeZone(date, timezone, 'h:mm a');
  const correctDay = formatInTimeZone(date, timezone, 'EEEE');
  console.log('\nWhat it SHOULD show:');
  console.log(`  Time in ${timezone}:`, correctTime);
  console.log(`  Day in ${timezone}:`, correctDay);
}

currentImplementation('America/New_York');
currentImplementation('Asia/Tokyo');
currentImplementation('UTC');

console.log('\n=== The Problem ===');
console.log('1. toDate with timezone option does NOT convert the date to that timezone');
console.log('2. It returns the SAME date object (check the boolean above)');
console.log('3. formatRelative always uses the SYSTEM timezone, not the dates passed');
console.log('4. The adjustedDate calculation creates a future date, not the correct relative date');

console.log('\n=== The Solution ===');
console.log('We need to implement our own relative formatting that:');
console.log('1. Calculates the day difference correctly');
console.log('2. Formats the time in the target timezone');
console.log('3. Builds the relative string manually');

console.log('\n=== Correct Implementation ===');
function correctImplementation(date, baseDate, timezone) {
  console.log(`\nTimezone: ${timezone}`);

  // Format the time in the target timezone
  const timeStr = formatInTimeZone(date, timezone, 'h:mm a');
  const dayOfWeek = formatInTimeZone(date, timezone, 'EEEE');

  // Calculate days between dates (in UTC, which is correct)
  const msPerDay = 24 * 60 * 60 * 1000;
  const startOfDayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOfDayBase = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const daysDiff = Math.round((startOfDayDate - startOfDayBase) / msPerDay);

  console.log('  Days difference:', daysDiff);
  console.log('  Time in timezone:', timeStr);
  console.log('  Day of week:', dayOfWeek);

  // Build relative string
  let result;
  if (daysDiff === 0) {
    result = `today at ${timeStr}`;
  } else if (daysDiff === -1) {
    result = `yesterday at ${timeStr}`;
  } else if (daysDiff === 1) {
    result = `tomorrow at ${timeStr}`;
  } else if (daysDiff >= -6 && daysDiff < -1) {
    result = `last ${dayOfWeek} at ${timeStr}`;
  } else if (daysDiff > 1 && daysDiff < 7) {
    result = `${dayOfWeek} at ${timeStr}`;
  } else {
    result = formatInTimeZone(date, timezone, 'MM/dd/yyyy');
  }

  console.log('  Result:', result);
  return result;
}

// Test with a base date 2 days after our test date
const baseDate = new Date('2024-01-03T14:00:00Z');
correctImplementation(date, baseDate, 'America/New_York');
correctImplementation(date, baseDate, 'Asia/Tokyo');
correctImplementation(date, baseDate, 'UTC');
