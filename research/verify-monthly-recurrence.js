const { addMonths, setDate, parseISO, format } = require('date-fns');
const { formatInTimeZone, toZonedTime, fromZonedTime } = require('date-fns-tz');

console.log('=== Monthly Recurrence Behavior Verification ===\n');
console.log('date-fns version:', require('date-fns/package.json').version);
console.log('date-fns-tz version:', require('date-fns-tz/package.json').version);

// Test 1: Month-end overflow behavior
console.log('\n--- Test 1: Month-end overflow with addMonths ---');
const jan31 = new Date(2024, 0, 31); // Jan 31, 2024
console.log('Start date:', format(jan31, 'yyyy-MM-dd'));

for (let i = 1; i <= 6; i++) {
  const result = addMonths(jan31, i);
  console.log(`+${i} month(s):`, format(result, 'yyyy-MM-dd EEE'));
}

// Test 2: What happens with setDate on invalid dates?
console.log('\n--- Test 2: setDate with invalid day numbers ---');
const feb2024 = new Date(2024, 1, 15); // Feb 15, 2024
console.log('Base date (Feb 2024):', format(feb2024, 'yyyy-MM-dd'));

[28, 29, 30, 31].forEach((day) => {
  const result = setDate(feb2024, day);
  console.log(`setDate(${day}):`, format(result, 'yyyy-MM-dd'));
});

// Test 3: Preserving day of month across months
console.log('\n--- Test 3: Preserving specific day across months ---');
const startDate = new Date(2024, 0, 15); // Jan 15
console.log('Start date:', format(startDate, 'yyyy-MM-dd'));

for (let i = 0; i < 12; i++) {
  const result = addMonths(startDate, i);
  console.log(`Month ${i}:`, format(result, 'yyyy-MM-dd'));
}

// Test 4: Timezone behavior with monthly recurrence
console.log('\n--- Test 4: Monthly recurrence across timezones ---');
const timezone = 'America/New_York';
const jan31InTz = fromZonedTime(new Date(2024, 0, 31, 14, 30), timezone);
console.log('Start (NY time):', formatInTimeZone(jan31InTz, timezone, 'yyyy-MM-dd HH:mm zzz'));

for (let i = 1; i <= 3; i++) {
  const result = addMonths(jan31InTz, i);
  console.log(`+${i} month(s):`, formatInTimeZone(result, timezone, 'yyyy-MM-dd HH:mm zzz'));
}

// Test 5: DST transitions with monthly recurrence
console.log('\n--- Test 5: Monthly recurrence across DST ---');
const beforeDST = fromZonedTime(new Date(2024, 1, 15, 14, 30), timezone); // Feb 15
const afterDST = addMonths(beforeDST, 1); // Mar 15 (after DST starts)
console.log('Before DST:', formatInTimeZone(beforeDST, timezone, 'yyyy-MM-dd HH:mm zzz'));
console.log('After DST:', formatInTimeZone(afterDST, timezone, 'yyyy-MM-dd HH:mm zzz'));

// Test 6: Last day of month behavior
console.log('\n--- Test 6: Getting last day of each month ---');
for (let month = 0; month < 12; month++) {
  const lastDay = new Date(2024, month + 1, 0); // Day 0 of next month = last day of current
  console.log(`Month ${month}:`, format(lastDay, 'yyyy-MM-dd'));
}

// Test 7: Leap year February behavior
console.log('\n--- Test 7: February in leap vs non-leap years ---');
[2023, 2024, 2025].forEach((year) => {
  const feb29 = new Date(year, 1, 29);
  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  console.log(`${year} (leap: ${isLeap}):`, format(feb29, 'yyyy-MM-dd'));
});

// Test 8: Handling "31st of every month" requirement
console.log('\n--- Test 8: Implementing "31st of every month" ---');
const implementMonthly31st = (startDate, months) => {
  const results = [];
  for (let i = 0; i < months; i++) {
    const targetMonth = addMonths(startDate, i);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(31, lastDay);
    results.push(new Date(year, month, day));
  }
  return results;
};

const monthlyResults = implementMonthly31st(new Date(2024, 0, 31), 12);
monthlyResults.forEach((date, i) => {
  console.log(`Month ${i}:`, format(date, 'yyyy-MM-dd'));
});
