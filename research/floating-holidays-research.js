#!/usr/bin/env node
/**
 * Research script for calculating floating holidays
 * Testing date-fns functions for "nth weekday of month" calculations
 */

const {
  setDate,
  setMonth,
  getDay,
  addWeeks,
  startOfMonth,
  getDate,
  format,
  setYear,
  addDays,
  lastDayOfMonth,
  getWeek,
} = require('date-fns');

console.log('=== Floating Holiday Calculation Research ===\n');

// Helper: Get nth occurrence of a weekday in a month
function getNthWeekdayOfMonth(year, month, weekday, n) {
  // month is 0-indexed in Date constructor
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = getDay(firstDay);

  // Calculate first occurrence of the target weekday
  let daysUntilTarget = weekday - firstDayOfWeek;
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }

  // Add weeks to get to nth occurrence
  const targetDate = addDays(firstDay, daysUntilTarget + (n - 1) * 7);

  // Verify it's still in the same month
  if (targetDate.getMonth() !== month - 1) {
    return null; // nth occurrence doesn't exist
  }

  return targetDate;
}

// Test Martin Luther King Jr. Day - 3rd Monday in January
console.log('1. Martin Luther King Jr. Day (3rd Monday in January):');
for (let year = 2024; year <= 2026; year++) {
  const mlkDay = getNthWeekdayOfMonth(year, 1, 1, 3); // 1 = Monday
  console.log(`  ${year}: ${format(mlkDay, 'EEEE, MMMM d, yyyy')}`);
}

// Test Thanksgiving - 4th Thursday in November
console.log('\n2. Thanksgiving (4th Thursday in November):');
for (let year = 2024; year <= 2026; year++) {
  const thanksgiving = getNthWeekdayOfMonth(year, 11, 4, 4); // 4 = Thursday
  console.log(`  ${year}: ${format(thanksgiving, 'EEEE, MMMM d, yyyy')}`);
}

// Test Labor Day - 1st Monday in September
console.log('\n3. Labor Day (1st Monday in September):');
for (let year = 2024; year <= 2026; year++) {
  const laborDay = getNthWeekdayOfMonth(year, 9, 1, 1); // 1 = Monday
  console.log(`  ${year}: ${format(laborDay, 'EEEE, MMMM d, yyyy')}`);
}

// Test Memorial Day - Last Monday in May
console.log('\n4. Memorial Day (Last Monday in May):');
function getLastWeekdayOfMonth(year, month, weekday) {
  const lastDay = lastDayOfMonth(new Date(year, month - 1));
  const lastDayOfWeek = getDay(lastDay);

  let daysBack = lastDayOfWeek - weekday;
  if (daysBack < 0) {
    daysBack += 7;
  }

  return addDays(lastDay, -daysBack);
}

for (let year = 2024; year <= 2026; year++) {
  const memorialDay = getLastWeekdayOfMonth(year, 5, 1); // 1 = Monday
  console.log(`  ${year}: ${format(memorialDay, 'EEEE, MMMM d, yyyy')}`);
}

// Test edge case: 5th Monday (might not exist)
console.log('\n5. Testing edge case - 5th Monday of months:');
for (let month = 1; month <= 12; month++) {
  const fifthMonday = getNthWeekdayOfMonth(2025, month, 1, 5);
  if (fifthMonday) {
    console.log(`  ${format(fifthMonday, 'MMMM yyyy')}: ${format(fifthMonday, 'EEEE, MMMM d')}`);
  }
}

// Test Good Friday calculation (complex - Friday before Easter)
console.log('\n6. Easter calculation research:');
console.log('  Easter is complex - requires Computus algorithm');
console.log('  Good Friday is 2 days before Easter Sunday');
console.log('  This might require a specialized library or embedded dates');

// Verify our helper function with known dates
console.log('\n7. Verification with known dates:');
const knownDates = [
  { year: 2024, month: 1, weekday: 1, n: 3, expected: 'January 15, 2024', name: 'MLK Day 2024' },
  {
    year: 2024,
    month: 11,
    weekday: 4,
    n: 4,
    expected: 'November 28, 2024',
    name: 'Thanksgiving 2024',
  },
  { year: 2025, month: 1, weekday: 1, n: 3, expected: 'January 20, 2025', name: 'MLK Day 2025' },
];

knownDates.forEach(({ year, month, weekday, n, expected, name }) => {
  const calculated = getNthWeekdayOfMonth(year, month, weekday, n);
  const formatted = format(calculated, 'MMMM d, yyyy');
  const correct = formatted === expected;
  console.log(`  ${name}: ${formatted} ${correct ? '✓' : '✗ (expected ' + expected + ')'}`);
});
