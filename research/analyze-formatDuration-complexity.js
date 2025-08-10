#!/usr/bin/env node

/**
 * Research script to understand formatDuration behavior and plan refactoring
 * Current complexity: 12 (limit: 10)
 */

console.log('=== formatDuration Complexity Analysis ===\n');

console.log('Current Implementation Logic:');
console.log('1. Takes milliseconds as input');
console.log('2. Handles negative values by tracking sign');
console.log('3. Converts to days, hours, minutes, seconds');
console.log('4. Builds human-readable string with proper pluralization');
console.log('5. Returns negative sign prefix for negative durations\n');

console.log('Complexity Contributors:');
console.log('1. Function entry: +1');
console.log('2. if (abs === 0): +1');
console.log('3. if (days > 0): +1');
console.log('4. Ternary for "day" vs "days": +1');
console.log('5. if (hours > 0): +1');
console.log('6. Ternary for "hour" vs "hours": +1');
console.log('7. if (minutes > 0): +1');
console.log('8. Ternary for "minute" vs "minutes": +1');
console.log('9. if (seconds > 0 || parts.length === 0): +2');
console.log('10. Ternary for "second" vs "seconds": +1');
console.log('11. Ternary for negative prefix: +1');
console.log('Total: 12\n');

console.log('=== Refactoring Strategy ===\n');

console.log('Extract these helper functions:\n');

console.log('1. pluralize(value: number, singular: string): string');
console.log('   - Handles "1 hour" vs "2 hours" logic');
console.log('   - Reduces 4 ternary operators (complexity -4)\n');

console.log('2. addTimeUnit(parts: string[], value: number, unit: string): void');
console.log('   - Adds formatted unit to parts array if value > 0');
console.log('   - Encapsulates the if-check and pluralization');
console.log('   - Reduces complexity by abstracting the pattern\n');

console.log('3. calculateTimeComponents(totalSeconds: number): TimeComponents');
console.log('   - Returns { days, hours, minutes, seconds }');
console.log('   - Separates calculation from formatting\n');

console.log('Expected Result:');
console.log('- formatDuration complexity: ~6-7 (under 10 ✓)');
console.log('- Cleaner, more maintainable code');
console.log('- Easier to test individual pieces\n');

// Test current behavior
console.log('=== Testing Current Behavior ===\n');

function formatDuration(milliseconds) {
  const abs = Math.abs(milliseconds);
  const negative = milliseconds < 0;

  if (abs === 0) {
    return '0 seconds';
  }

  const totalSeconds = Math.floor(abs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  const formatted = parts.join(' ');
  return negative ? `-${formatted}` : formatted;
}

// Test cases
const testCases = [
  { ms: 0, expected: '0 seconds' },
  { ms: 1000, expected: '1 second' },
  { ms: 2000, expected: '2 seconds' },
  { ms: 60000, expected: '1 minute' },
  { ms: 61000, expected: '1 minute 1 second' },
  { ms: 3600000, expected: '1 hour' },
  { ms: 3661000, expected: '1 hour 1 minute 1 second' },
  { ms: 86400000, expected: '1 day' },
  { ms: 90061000, expected: '1 day 1 hour 1 minute 1 second' },
  { ms: -90061000, expected: '-1 day 1 hour 1 minute 1 second' },
  { ms: 120000, expected: '2 minutes' },
  { ms: 7200000, expected: '2 hours' },
  { ms: 172800000, expected: '2 days' },
];

console.log('Test Results:');
testCases.forEach(({ ms, expected }) => {
  const result = formatDuration(ms);
  const pass = result === expected ? '✓' : '✗';
  console.log(`${pass} formatDuration(${ms}) = "${result}" (expected: "${expected}")`);
});