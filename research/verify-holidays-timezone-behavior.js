#!/usr/bin/env node

/**
 * Research script to understand timezone behavior in holidays.ts
 * Focus on calculateFloatingHoliday and getObservedDate functions
 */

const { addDays, getDay, lastDayOfMonth } = require('date-fns');

console.log('=== Holidays Timezone Behavior Research ===\n');

// Test 1: Understanding Date constructor behavior
console.log('1. Date Constructor Behavior:');
console.log('new Date(2025, 0, 1) creates:', new Date(2025, 0, 1));
console.log('ISO String:', new Date(2025, 0, 1).toISOString());
console.log('Local String:', new Date(2025, 0, 1).toString());
console.log('Timezone offset:', new Date(2025, 0, 1).getTimezoneOffset(), 'minutes');
console.log();

// Test 2: How holidays.ts creates dates
console.log('2. Holiday Date Creation Pattern:');
console.log('Fixed holiday: new Date(year, month - 1, day)');
const july4 = new Date(2025, 6, 4); // July 4, 2025
console.log('July 4, 2025:', july4.toString());
console.log('ISO:', july4.toISOString());
console.log();

// Test 3: Floating holiday calculation
console.log('3. Floating Holiday Calculation:');
// MLK Day - 3rd Monday in January 2025
const year = 2025;
const month = 1;
const weekday = 1; // Monday
const occurrence = 3;

const firstDay = new Date(year, month - 1, 1);
console.log('First day of month:', firstDay.toString());
console.log('Day of week:', getDay(firstDay), '(0=Sun, 6=Sat)');

const firstDayOfWeek = getDay(firstDay);
let daysUntilTarget = weekday - firstDayOfWeek;
if (daysUntilTarget < 0) {
  daysUntilTarget += 7;
}
console.log('Days until first Monday:', daysUntilTarget);

const targetDate = addDays(firstDay, daysUntilTarget + (occurrence - 1) * 7);
console.log('3rd Monday (MLK Day):', targetDate.toString());
console.log();

// Test 4: Last occurrence calculation
console.log('4. Last Occurrence Calculation:');
// Memorial Day - Last Monday in May
const may2025 = 5;
const lastDay = lastDayOfMonth(new Date(2025, may2025 - 1));
console.log('Last day of May:', lastDay.toString());
const lastDayOfWeek = getDay(lastDay);
console.log('Day of week:', lastDayOfWeek);

let daysBack = lastDayOfWeek - weekday; // weekday = 1 (Monday)
if (daysBack < 0) {
  daysBack += 7;
}
console.log('Days back to Monday:', daysBack);
const memorialDay = addDays(lastDay, -daysBack);
console.log('Memorial Day:', memorialDay.toString());
console.log();

// Test 5: Victoria Day special case
console.log('5. Victoria Day Special Case (Monday on or before May 24):');
const may24 = new Date(2025, 4, 24); // May 24, 2025
console.log('May 24, 2025:', may24.toString());
console.log('Day of week:', getDay(may24), '(Saturday)');
const dayOfWeek = getDay(may24);
const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
console.log('Days to subtract:', daysToSubtract);
const victoriaDay = addDays(may24, -daysToSubtract);
console.log('Victoria Day:', victoriaDay.toString());
console.log();

// Test 6: Observed date calculations
console.log('6. Observed Date Calculations:');
// Test US Federal rule (Sat->Fri, Sun->Mon)
const saturday = new Date(2025, 6, 5); // Saturday
const sunday = new Date(2025, 6, 6); // Sunday
console.log('Original Saturday:', saturday.toString());
console.log('US Federal observed:', addDays(saturday, -1).toString(), '(Friday)');
console.log('Original Sunday:', sunday.toString());
console.log('US Federal observed:', addDays(sunday, 1).toString(), '(Monday)');
console.log();

// Test UK Bank rule (Sat->Mon, Sun->Mon)
console.log('UK Bank Holiday rules:');
console.log('Saturday observed:', addDays(saturday, 2).toString(), '(Monday)');
console.log('Sunday observed:', addDays(sunday, 1).toString(), '(Monday)');
console.log();

// Test Chile Monday-moving rule
console.log('7. Chile Monday-moving rule:');
const testDates = [
  new Date(2025, 5, 29), // Sunday June 29
  new Date(2025, 5, 30), // Monday June 30
  new Date(2025, 6, 1), // Tuesday July 1
  new Date(2025, 6, 2), // Wednesday July 2
  new Date(2025, 6, 3), // Thursday July 3
  new Date(2025, 6, 4), // Friday July 4
  new Date(2025, 6, 5), // Saturday July 5
];

testDates.forEach((date) => {
  const dow = getDay(date);
  let observed = date;

  if (dow >= 2 && dow <= 4) {
    // Tue, Wed, Thu -> previous Monday
    observed = addDays(date, -(dow - 1));
  } else if (dow === 0) {
    // Sunday -> next Monday
    observed = addDays(date, 1);
  } else if (dow === 6) {
    // Saturday -> next Monday
    observed = addDays(date, 2);
  }
  // Monday or Friday -> no change

  console.log(
    `${date.toDateString()} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]}) -> ${observed.toDateString()}`
  );
});

console.log('\n=== Key Findings ===');
console.log(
  '1. All holiday dates are created in LOCAL timezone using new Date(year, month-1, day)'
);
console.log('2. This ensures holidays occur on the correct calendar date regardless of timezone');
console.log('3. date-fns functions preserve the timezone context of the input date');
console.log('4. No timezone conversions happen - dates stay in local timezone throughout');
