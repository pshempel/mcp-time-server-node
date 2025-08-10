const { parseISO, isValid } = require('date-fns');
const { getTimezoneOffset } = require('date-fns-tz');

console.log('=== Recurrence Validation Behavior Verification ===\n');
console.log('date-fns version:', require('date-fns/package.json').version);
console.log('date-fns-tz version:', require('date-fns-tz/package.json').version);

// Test 1: Timezone validation
console.log('\n--- Test 1: Timezone validation ---');
const timezones = [
  undefined, // Should use system timezone
  null, // Should use system timezone
  '', // Should use UTC (explicit)
  'UTC', // Valid timezone
  'America/New_York', // Valid timezone
  'Europe/London', // Valid timezone
  'Invalid/Zone', // Invalid timezone
  'US/Eastern', // Deprecated but valid
];

timezones.forEach((tz) => {
  try {
    if (tz === undefined || tz === null) {
      console.log(`${JSON.stringify(tz)}: Should use system timezone`);
    } else if (tz === '') {
      console.log(`"": Should use UTC (explicit Unix convention)`);
    } else {
      const offset = getTimezoneOffset(tz, new Date());
      const valid = !isNaN(offset);
      console.log(`"${tz}": ${valid ? 'Valid' : 'Invalid'} (offset: ${offset})`);
    }
  } catch (e) {
    console.log(`"${tz}": Error - ${e.message}`);
  }
});

// Test 2: Pattern validation
console.log('\n--- Test 2: Pattern validation ---');
const patterns = ['daily', 'weekly', 'monthly', 'yearly', 'DAILY', 'Daily', 'hourly', 'invalid'];
const validPatterns = ['daily', 'weekly', 'monthly', 'yearly'];

patterns.forEach((pattern) => {
  const normalized = pattern.toLowerCase();
  const valid = validPatterns.includes(normalized);
  console.log(`"${pattern}" -> "${normalized}": ${valid ? 'Valid' : 'Invalid'}`);
});

// Test 3: Time format validation
console.log('\n--- Test 3: Time format validation ---');
const times = [
  '14:30', // Valid
  '02:45', // Valid
  '0:00', // Valid single digit hour
  '23:59', // Valid edge
  '24:00', // Invalid hour
  '12:60', // Invalid minute
  '14:30:00', // Invalid (has seconds)
  '14', // Invalid format
  '14:3', // Invalid (minute needs 2 digits)
  undefined, // Valid (optional)
];

times.forEach((time) => {
  if (time === undefined) {
    console.log('undefined: Valid (optional)');
    return;
  }

  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    console.log(`"${time}": Invalid format`);
  } else {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const valid = hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    console.log(`"${time}": ${valid ? 'Valid' : 'Invalid'} (${hours}h ${minutes}m)`);
  }
});

// Test 4: Day of week validation
console.log('\n--- Test 4: Day of week validation ---');
const daysOfWeek = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 0.5, undefined];
daysOfWeek.forEach((day) => {
  if (day === undefined) {
    console.log('undefined: Valid (optional)');
  } else {
    const valid = Number.isInteger(day) && day >= 0 && day <= 6;
    console.log(`${day}: ${valid ? 'Valid' : 'Invalid'}`);
  }
});

// Test 5: Day of month validation
console.log('\n--- Test 5: Day of month validation ---');
const daysOfMonth = [-2, -1, 0, 1, 15, 31, 32, 1.5, undefined];
daysOfMonth.forEach((day) => {
  if (day === undefined) {
    console.log('undefined: Valid (optional)');
  } else {
    // Note: -1 is special case for last day
    const valid = Number.isInteger(day) && ((day >= 1 && day <= 31) || day === -1);
    console.log(`${day}: ${valid ? 'Valid' : 'Invalid'} ${day === -1 ? '(last day)' : ''}`);
  }
});

// Test 6: Month validation (for yearly)
console.log('\n--- Test 6: Month validation (0-11) ---');
const months = [-1, 0, 1, 5, 11, 12, undefined];
months.forEach((month) => {
  if (month === undefined) {
    console.log('undefined: Valid (optional)');
  } else {
    const valid = Number.isInteger(month) && month >= 0 && month <= 11;
    console.log(`${month}: ${valid ? 'Valid' : 'Invalid'}`);
  }
});

// Test 7: Date string validation
console.log('\n--- Test 7: Date string validation ---');
const dates = [
  '2024-01-15T10:30:00Z', // Valid ISO
  '2024-01-15', // Valid ISO date
  '2024-01-15T10:30:00+05:00', // Valid with offset
  'invalid-date', // Invalid
  '', // Empty string
  undefined, // Valid (optional - use current time)
  null, // Valid (optional - use current time)
];

dates.forEach((date) => {
  if (date === undefined || date === null) {
    console.log(`${date}: Valid (optional - use current time)`);
  } else if (date === '') {
    console.log('"": Invalid (empty string)');
  } else {
    try {
      const parsed = parseISO(date);
      const valid = isValid(parsed);
      console.log(`"${date}": ${valid ? 'Valid' : 'Invalid'}`);
    } catch (e) {
      console.log(`"${date}": Invalid (${e.message})`);
    }
  }
});
