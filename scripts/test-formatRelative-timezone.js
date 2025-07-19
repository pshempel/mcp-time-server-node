const { formatRelative, parseISO } = require('date-fns');
const { toDate, toZonedTime, formatInTimeZone } = require('date-fns-tz');

console.log('Testing formatRelative with timezones\n');

// Test date: Monday, January 1, 2024 at 9:30 AM UTC
const testDateStr = '2024-01-01T09:30:00.000Z';
const testDate = parseISO(testDateStr);

// Base date for relative formatting (now): January 3, 2024 at 2:00 PM UTC
const nowStr = '2024-01-03T14:00:00.000Z';
const now = parseISO(nowStr);

console.log('Test Date (UTC):', testDate.toISOString());
console.log('Now (UTC):', now.toISOString());
console.log('');

// Test 1: Basic formatRelative without timezone consideration
console.log('=== Test 1: Basic formatRelative (no timezone) ===');
const basic = formatRelative(testDate, now);
console.log('Result:', basic);
console.log('');

// Test 2: Using toDate for timezone conversion (current approach)
console.log('=== Test 2: Using toDate (current approach) ===');
function testToDateApproach(timezone) {
  console.log(`\nTimezone: ${timezone}`);

  const zonedDate = toDate(testDate, { timeZone: timezone });
  const zonedNow = toDate(now, { timeZone: timezone });

  console.log('zonedDate:', zonedDate.toISOString());
  console.log('zonedNow:', zonedNow.toISOString());

  // Calculate time difference
  const timeDiff = zonedDate.getTime() - zonedNow.getTime();
  console.log('Time difference (ms):', timeDiff);

  // Create adjusted date
  const adjustedDate = new Date(Date.now() + timeDiff);
  console.log('adjustedDate:', adjustedDate.toISOString());

  const result = formatRelative(adjustedDate, new Date());
  console.log('Result:', result);
}

testToDateApproach('America/New_York');
testToDateApproach('Asia/Tokyo');
testToDateApproach('UTC');
console.log('');

// Test 3: Using toZonedTime
console.log('=== Test 3: Using toZonedTime ===');
function testToZonedTimeApproach(timezone) {
  console.log(`\nTimezone: ${timezone}`);

  const zonedDate = toZonedTime(testDate, timezone);
  const zonedNow = toZonedTime(now, timezone);

  console.log('zonedDate:', zonedDate.toISOString());
  console.log('zonedNow:', zonedNow.toISOString());

  const result = formatRelative(zonedDate, zonedNow);
  console.log('Result:', result);
}

testToZonedTimeApproach('America/New_York');
testToZonedTimeApproach('Asia/Tokyo');
testToZonedTimeApproach('UTC');
console.log('');

// Test 4: Understanding the real issue
console.log('=== Test 4: Understanding the issue ===');
console.log('\nThe problem is that formatRelative uses the LOCAL timezone of the system');
console.log('for formatting, regardless of the dates passed to it.\n');

// Test 5: Custom baseDate with options
console.log('=== Test 5: Using baseDate option ===');
function testWithBaseDate(timezone) {
  console.log(`\nTimezone: ${timezone}`);

  // formatRelative with baseDate option
  const result = formatRelative(testDate, now);
  console.log('Result:', result);

  // Show what the dates look like in the target timezone
  const dateInTz = formatInTimeZone(testDate, timezone, 'PPPPpppp');
  const nowInTz = formatInTimeZone(now, timezone, 'PPPPpppp');
  console.log('Date in timezone:', dateInTz);
  console.log('Now in timezone:', nowInTz);
}

testWithBaseDate('America/New_York');
testWithBaseDate('Asia/Tokyo');
console.log('');

// Test 6: The correct approach - format in timezone first, then describe
console.log('=== Test 6: Correct approach - format strings in timezone ===');
function correctApproach(timezone) {
  console.log(`\nTimezone: ${timezone}`);

  // Get the formatted strings in the target timezone
  const dateStr = formatInTimeZone(testDate, timezone, "EEEE 'at' h:mm a");
  const dayOfWeek = formatInTimeZone(testDate, timezone, 'EEEE');
  const time = formatInTimeZone(testDate, timezone, 'h:mm a');

  console.log('Formatted date string:', dateStr);
  console.log('Day of week:', dayOfWeek);
  console.log('Time:', time);

  // Calculate days difference
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor((now - testDate) / msPerDay);
  console.log('Days difference:', daysDiff);

  // Build relative string based on days difference
  let relative;
  if (daysDiff === 0) {
    relative = `today at ${time}`;
  } else if (daysDiff === 1) {
    relative = `yesterday at ${time}`;
  } else if (daysDiff === -1) {
    relative = `tomorrow at ${time}`;
  } else if (daysDiff < 7 && daysDiff > 0) {
    relative = `last ${dayOfWeek} at ${time}`;
  } else if (daysDiff > -7 && daysDiff < 0) {
    relative = `${dayOfWeek} at ${time}`;
  } else {
    relative = formatInTimeZone(testDate, timezone, 'MM/dd/yyyy');
  }

  console.log('Relative result:', relative);
}

correctApproach('America/New_York');
correctApproach('Asia/Tokyo');
correctApproach('UTC');
console.log('');

// Test 7: Edge cases with different base dates
console.log('=== Test 7: Edge cases ===');
const testCases = [
  { date: '2024-01-03T09:00:00Z', base: '2024-01-03T14:00:00Z', desc: 'Same day' },
  { date: '2024-01-02T09:00:00Z', base: '2024-01-03T14:00:00Z', desc: 'Yesterday' },
  { date: '2024-01-04T09:00:00Z', base: '2024-01-03T14:00:00Z', desc: 'Tomorrow' },
  { date: '2023-12-28T09:00:00Z', base: '2024-01-03T14:00:00Z', desc: 'Last week' },
];

testCases.forEach(({ date, base, desc }) => {
  console.log(`\n${desc}:`);
  const d = parseISO(date);
  const b = parseISO(base);
  console.log('Native formatRelative:', formatRelative(d, b));

  // Show in different timezones
  console.log('NY time:', formatInTimeZone(d, 'America/New_York', "EEEE 'at' h:mm a"));
  console.log('Tokyo time:', formatInTimeZone(d, 'Asia/Tokyo', "EEEE 'at' h:mm a"));
});
