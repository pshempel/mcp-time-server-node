#!/usr/bin/env node

/**
 * Research script to understand daysUntil behavior and plan refactoring
 * Current: 77 lines, complexity 23
 */

console.log('=== daysUntil Complexity Analysis ===\n');

console.log('Current Implementation Logic:');
console.log('1. Validates target_date is provided');
console.log('2. Validates string length for security');
console.log('3. Resolves timezone (undefined → system, empty → UTC)');
console.log('4. Checks cache for previous results');
console.log('5. Validates timezone if provided');
console.log('6. Parses target date (Unix timestamp, number, or ISO string)');
console.log('7. Converts dates to timezone for calendar comparison');
console.log('8. Calculates calendar days difference');
console.log('9. Formats result if requested (Today, Tomorrow, etc.)');
console.log('10. Caches result with appropriate TTL\n');

console.log('Complexity Contributors:');
console.log('1. Function entry: +1');
console.log('2. if (!params.target_date): +1');
console.log("3. if (typeof params.target_date === 'string'): +1");
console.log('4. Ternary for timezone: +1');
console.log("5. OR operator (|| 'UTC'): +1");
console.log('6. if (cached !== undefined): +1');
console.log('7. if (userTimezone !== undefined && !validateTimezone): +2');
console.log("8. if (typeof target_date === 'string' && regex test): +2");
console.log('9. if (isNaN(timestamp)): +1');
console.log("10. else if (typeof target_date === 'number'): +1");
console.log('11. if (!isValid(targetDate)): +1');
console.log('12. Ternary for nowInTimezone: +1');
console.log('13. Ternary for targetInTimezone: +1');
console.log('14. if (format_result): +1');
console.log('15. if (daysUntil === 0): +1');
console.log('16. else if (daysUntil === 1): +1');
console.log('17. else if (daysUntil === -1): +1');
console.log('18. else if (daysUntil > 0): +1');
console.log('19. Ternary for TTL: +1');
console.log('20. Ternary for abs(daysUntil) === 0: +1');
console.log('Total: 23\n');

console.log('=== Refactoring Strategy ===\n');

console.log('Extract these helper functions:\n');

console.log(
  '1. resolveTimezone(userTimezone: string | undefined, defaultTimezone: string): string'
);
console.log('   - Handles undefined → default, empty → UTC logic');
console.log('   - Reduces complexity by ~2\n');

console.log('2. parseTargetDate(target_date: string | number): Date');
console.log('   - Handles Unix timestamp, number, and ISO string parsing');
console.log('   - Includes validation');
console.log('   - Reduces complexity by ~5-6\n');

console.log('3. convertToTimezone(date: Date, timezone: string): Date');
console.log('   - Handles UTC vs timezone conversion');
console.log('   - Reduces ternary complexity by ~2\n');

console.log('4. formatDaysUntil(days: number): string');
console.log('   - Handles Today, Tomorrow, Yesterday, "in X days", "X days ago"');
console.log('   - Reduces complexity by ~5\n');

console.log('5. getCacheTTL(daysUntil: number): number');
console.log('   - Determines appropriate cache TTL based on days');
console.log('   - Reduces complexity by ~2\n');

console.log('Expected Result:');
console.log('- Main function complexity: ~7-10 (under 10 ✓)');
console.log('- Much cleaner separation of concerns');
console.log('- Easier to test individual pieces\n');

// Test current behavior patterns
console.log('=== Testing Current Behavior ===\n');

// Simulate the timezone resolution logic
function resolveTimezone(userTimezone, defaultTimezone) {
  return userTimezone === undefined ? defaultTimezone : userTimezone || 'UTC';
}

// Test timezone resolution
console.log('Timezone Resolution Tests:');
const timezoneTests = [
  { input: undefined, default: 'America/New_York', expected: 'America/New_York' },
  { input: '', default: 'America/New_York', expected: 'UTC' },
  { input: 'Europe/London', default: 'America/New_York', expected: 'Europe/London' },
];

timezoneTests.forEach(({ input, default: def, expected }) => {
  const result = resolveTimezone(input, def);
  const pass = result === expected ? '✓' : '✗';
  console.log(
    `${pass} resolveTimezone(${input === undefined ? 'undefined' : `'${input}'`}, '${def}') = '${result}' (expected: '${expected}')`
  );
});

console.log('\nDate Parsing Tests:');
// Simulate date parsing logic
function parseTargetDate(target_date) {
  if (typeof target_date === 'string' && /^\d+$/.test(target_date)) {
    const timestamp = parseInt(target_date, 10);
    return new Date(timestamp * 1000);
  } else if (typeof target_date === 'number') {
    return new Date(target_date * 1000);
  } else {
    return new Date(target_date); // Simplified for testing
  }
}

const dateTests = [
  { input: '1735689600', expected: '2025-01-01T00:00:00.000Z' },
  { input: 1735689600, expected: '2025-01-01T00:00:00.000Z' },
  { input: '2025-01-01T00:00:00Z', expected: '2025-01-01T00:00:00.000Z' },
];

dateTests.forEach(({ input, expected }) => {
  const result = parseTargetDate(input);
  const resultStr = result.toISOString();
  const pass = resultStr === expected ? '✓' : '✗';
  console.log(
    `${pass} parseTargetDate(${typeof input === 'string' ? `'${input}'` : input}) = '${resultStr}' (expected: '${expected}')`
  );
});

console.log('\nFormat Result Tests:');
// Simulate formatting logic
function formatDaysUntil(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

const formatTests = [
  { days: 0, expected: 'Today' },
  { days: 1, expected: 'Tomorrow' },
  { days: -1, expected: 'Yesterday' },
  { days: 5, expected: 'in 5 days' },
  { days: -5, expected: '5 days ago' },
  { days: 365, expected: 'in 365 days' },
  { days: -365, expected: '365 days ago' },
];

formatTests.forEach(({ days, expected }) => {
  const result = formatDaysUntil(days);
  const pass = result === expected ? '✓' : '✗';
  console.log(`${pass} formatDaysUntil(${days}) = '${result}' (expected: '${expected}')`);
});

console.log('\nCache TTL Tests:');
// Simulate cache TTL logic
const CacheTTL = {
  CURRENT_TIME: 5000,
  CALCULATIONS: 3600000,
};

function getCacheTTL(daysUntil) {
  return Math.abs(daysUntil) === 0 ? CacheTTL.CURRENT_TIME : CacheTTL.CALCULATIONS;
}

const ttlTests = [
  { days: 0, expected: CacheTTL.CURRENT_TIME },
  { days: 1, expected: CacheTTL.CALCULATIONS },
  { days: -1, expected: CacheTTL.CALCULATIONS },
  { days: 365, expected: CacheTTL.CALCULATIONS },
];

ttlTests.forEach(({ days, expected }) => {
  const result = getCacheTTL(days);
  const pass = result === expected ? '✓' : '✗';
  console.log(`${pass} getCacheTTL(${days}) = ${result} (expected: ${expected})`);
});
