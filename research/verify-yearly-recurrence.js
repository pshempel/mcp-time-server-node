const { addYears, format } = require('date-fns');
const { formatInTimeZone, toZonedTime, fromZonedTime } = require('date-fns-tz');

console.log('=== Yearly Recurrence Behavior Verification ===\n');
console.log('date-fns version:', require('date-fns/package.json').version);
console.log('date-fns-tz version:', require('date-fns-tz/package.json').version);

// Test 1: Basic yearly addition
console.log('\n--- Test 1: Basic yearly addition ---');
const dates = [
  new Date(2024, 0, 15), // Jan 15, 2024
  new Date(2024, 1, 29), // Feb 29, 2024 (leap year)
  new Date(2023, 1, 28), // Feb 28, 2023 (non-leap)
  new Date(2024, 11, 31), // Dec 31, 2024
];

dates.forEach((date) => {
  const nextYear = addYears(date, 1);
  console.log(`${format(date, 'yyyy-MM-dd')} + 1 year = ${format(nextYear, 'yyyy-MM-dd')}`);
});

// Test 2: Leap year February 29 behavior
console.log('\n--- Test 2: Leap year Feb 29 behavior ---');
const feb29_2024 = new Date(2024, 1, 29);
for (let i = 1; i <= 4; i++) {
  const result = addYears(feb29_2024, i);
  const year = 2024 + i;
  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  console.log(
    `2024-02-29 + ${i} year(s) = ${format(result, 'yyyy-MM-dd')} (${year} leap: ${isLeap})`,
  );
}

// Test 3: Yearly with specific month/day
console.log('\n--- Test 3: Implementing yearly on specific date ---');
const implementYearlySpecific = (from, targetMonth, targetDay) => {
  const fromYear = from.getFullYear();
  let targetDate = new Date(fromYear, targetMonth, targetDay);

  // If the target date has passed this year, use it
  // Otherwise, advance to next year
  if (targetDate <= from) {
    targetDate = new Date(fromYear + 1, targetMonth, targetDay);
  }

  return targetDate;
};

const now = new Date(2024, 5, 15); // June 15, 2024
console.log('From:', format(now, 'yyyy-MM-dd'));

// Test various target dates
const targets = [
  { month: 0, day: 1, desc: 'Jan 1' },
  { month: 6, day: 4, desc: 'Jul 4' },
  { month: 11, day: 25, desc: 'Dec 25' },
  { month: 1, day: 29, desc: 'Feb 29' },
];

targets.forEach(({ month, day, desc }) => {
  const next = implementYearlySpecific(now, month, day);
  console.log(`Next ${desc}:`, format(next, 'yyyy-MM-dd'));
});

// Test 4: Timezone behavior with yearly
console.log('\n--- Test 4: Yearly across timezones ---');
const timezone = 'America/New_York';
const nyTime = fromZonedTime(new Date(2024, 5, 15, 14, 30), timezone);
console.log('Start (NY):', formatInTimeZone(nyTime, timezone, 'yyyy-MM-dd HH:mm zzz'));

const nextYearNY = addYears(nyTime, 1);
console.log('Next year (NY):', formatInTimeZone(nextYearNY, timezone, 'yyyy-MM-dd HH:mm zzz'));

// Test 5: DST impact on yearly recurrence
console.log('\n--- Test 5: DST impact on yearly recurrence ---');
// March 10, 2024 is during DST in NY
const dstDate = fromZonedTime(new Date(2024, 2, 10, 14, 30), timezone);
console.log('During DST:', formatInTimeZone(dstDate, timezone, 'yyyy-MM-dd HH:mm zzz'));

const nextYearDST = addYears(dstDate, 1);
console.log('Next year:', formatInTimeZone(nextYearDST, timezone, 'yyyy-MM-dd HH:mm zzz'));

// Test 6: Current nextOccurrence yearly behavior
console.log('\n--- Test 6: Simulating current yearly behavior ---');
const simulateCurrentYearly = (from, time, tz) => {
  let nextDate;

  if (tz && tz !== 'UTC') {
    const zonedStart = toZonedTime(from, tz);
    nextDate = addYears(zonedStart, 1);

    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      nextDate.setHours(hours, minutes, 0, 0);
    }

    return fromZonedTime(nextDate, tz);
  } else {
    nextDate = addYears(from, 1);

    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      nextDate.setUTCHours(hours, minutes, 0, 0);
    }

    return nextDate;
  }
};

const testStart = new Date('2024-06-15T10:30:00Z');
console.log('Start:', testStart.toISOString());
console.log('Simple yearly:', simulateCurrentYearly(testStart).toISOString());
console.log('Yearly at 14:00 UTC:', simulateCurrentYearly(testStart, '14:00').toISOString());
console.log(
  'Yearly at 14:00 NY:',
  simulateCurrentYearly(testStart, '14:00', 'America/New_York').toISOString(),
);
