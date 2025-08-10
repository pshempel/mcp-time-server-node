#!/usr/bin/env node
/**
 * Research script for observed holiday rules
 * Testing how different countries handle holidays that fall on weekends
 */

const { getDay, addDays, format, subDays } = require('date-fns');

console.log('=== Observed Holiday Rules Research ===\n');

// Helper: Calculate observed date based on country rules
function getObservedDate(date, country = 'US') {
  const dayOfWeek = getDay(date);

  switch (country) {
    case 'US':
      // US Federal holidays:
      // Saturday -> Friday (previous day)
      // Sunday -> Monday (next day)
      if (dayOfWeek === 6) return addDays(date, -1); // Saturday to Friday
      if (dayOfWeek === 0) return addDays(date, 1); // Sunday to Monday
      return date;

    case 'UK':
      // UK Bank holidays:
      // Saturday -> Monday (next Monday)
      // Sunday -> Monday (next Monday)
      // If both weekend days are holidays, observe on Monday and Tuesday
      if (dayOfWeek === 6 || dayOfWeek === 0) return addDays(date, (8 - dayOfWeek) % 7);
      return date;

    case 'CA':
      // Canada:
      // Saturday -> Monday (next Monday)
      // Sunday -> Monday (next Monday)
      if (dayOfWeek === 6 || dayOfWeek === 0) return addDays(date, (8 - dayOfWeek) % 7);
      return date;

    default:
      return date; // No observation rules
  }
}

// Test various holidays in 2025-2027
console.log('1. US Federal Holiday Observation Rules:');
const testDates = [
  { date: new Date(2025, 6, 4), name: 'Independence Day 2025 (Friday)' },
  { date: new Date(2026, 6, 4), name: 'Independence Day 2026 (Saturday)' },
  { date: new Date(2027, 6, 4), name: 'Independence Day 2027 (Sunday)' },
  { date: new Date(2025, 11, 25), name: 'Christmas 2025 (Thursday)' },
  { date: new Date(2026, 11, 25), name: 'Christmas 2026 (Friday)' },
  { date: new Date(2027, 11, 25), name: 'Christmas 2027 (Saturday)' },
];

testDates.forEach(({ date, name }) => {
  const observed = getObservedDate(date, 'US');
  const isObserved = date.getTime() !== observed.getTime();
  console.log(`  ${name}: ${format(date, 'EEEE, MMM d')}`);
  if (isObserved) {
    console.log(`    -> Observed on ${format(observed, 'EEEE, MMM d')}`);
  }
});

// Test UK Boxing Day scenario
console.log('\n2. UK Bank Holiday Rules (Christmas/Boxing Day):');
const christmas2027 = new Date(2027, 11, 25); // Saturday
const boxingDay2027 = new Date(2027, 11, 26); // Sunday
console.log(`  Christmas 2027: ${format(christmas2027, 'EEEE, MMM d')}`);
console.log(`    -> Observed on ${format(getObservedDate(christmas2027, 'UK'), 'EEEE, MMM d')}`);
console.log(`  Boxing Day 2027: ${format(boxingDay2027, 'EEEE, MMM d')}`);
console.log(`    -> Would need special handling for consecutive holidays`);

// Test edge cases
console.log('\n3. Edge Cases:');
console.log("  - New Year's Day on Saturday: Company policies vary");
console.log('  - Some holidays never observe (e.g., Election Day in US)');
console.log('  - Some states/provinces have different rules');

// Design considerations
console.log('\n4. Design Considerations:');
console.log('  - Need per-holiday observe rules, not just per-country');
console.log('  - Some holidays have special rules (e.g., never observe)');
console.log('  - Need to handle consecutive holiday scenarios');
console.log('  - Corporate vs Federal observation can differ');

// Test implementation approach
console.log('\n5. Proposed Holiday Definition Structure:');
const holidayDefinition = {
  name: 'Independence Day',
  type: 'fixed',
  month: 7,
  day: 4,
  observe: 'US_FEDERAL', // or 'NEVER', 'UK_BANK', 'NEXT_WEEKDAY', etc.
  // For floating holidays:
  // type: 'floating',
  // month: 11,
  // weekday: 4, // Thursday
  // occurrence: 4, // 4th occurrence
};
console.log(JSON.stringify(holidayDefinition, null, 2));

// Calculate business impact
console.log('\n6. Business Days Impact Example:');
const july4_2026 = new Date(2026, 6, 4); // Saturday
const july3_2026 = new Date(2026, 6, 3); // Friday (observed)
console.log(`  Without observation: July 3 (Fri) = business day, July 4 (Sat) = weekend`);
console.log(`  With observation: July 3 (Fri) = holiday (observed), July 4 (Sat) = weekend`);
console.log(`  Impact: One less business day when counting`);
