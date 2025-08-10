#!/usr/bin/env npx tsx
/**
 * Research script to verify timezone resolution behavior
 * Tests the critical convention:
 * - undefined → system local timezone
 * - "" (empty string) → UTC
 * - other string → that specific timezone
 */

import { formatInTimeZone } from 'date-fns-tz';

// Get system's default timezone
const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('System timezone:', systemTimezone);
console.log('');

// Test date
const testDate = new Date('2025-01-31T12:00:00Z');
console.log('Test date (UTC):', testDate.toISOString());
console.log('');

// Test resolution patterns
function resolveTimezone(timezone: string | undefined, defaultTimezone: string): string {
  if (timezone === '') return 'UTC';
  return timezone ?? defaultTimezone;
}

// Test cases
const testCases = [
  { input: undefined, expected: systemTimezone, description: 'undefined → system timezone' },
  { input: '', expected: 'UTC', description: 'empty string → UTC' },
  {
    input: 'America/New_York',
    expected: 'America/New_York',
    description: 'specific → that timezone',
  },
  {
    input: 'Europe/London',
    expected: 'Europe/London',
    description: 'another specific → that timezone',
  },
];

console.log('Testing resolution logic:');
console.log('=========================');
testCases.forEach(({ input, expected, description }) => {
  const resolved = resolveTimezone(input, systemTimezone);
  const matches = resolved === expected;
  console.log(`${description}`);
  console.log(`  Input: ${input === undefined ? 'undefined' : `"${input}"`}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Resolved: ${resolved}`);
  console.log(`  ✓ ${matches ? 'PASS' : 'FAIL'}`);

  // Show formatted time in resolved timezone
  const formatted = formatInTimeZone(testDate, resolved, 'yyyy-MM-dd HH:mm:ss zzz');
  console.log(`  Formatted: ${formatted}`);
  console.log('');
});

// Test edge cases
console.log('Edge cases:');
console.log('===========');

// What about null? (should not happen in TypeScript but verify)
try {
  const nullCase = resolveTimezone(null as any, systemTimezone);
  console.log(`null input → ${nullCase} (treated as undefined)`);
} catch (e) {
  console.log(`null input → ERROR: ${e}`);
}

// What about whitespace?
const whitespaceCase = resolveTimezone('  ', systemTimezone);
console.log(
  `"  " (spaces) → "${whitespaceCase}" (treated as specific timezone - would fail validation)`
);

// Verify falsy behavior
console.log('');
console.log('Falsy value behavior:');
console.log('=====================');
console.log(`'' || 'default' → ${'' || 'default'} (evaluates to 'default' - WRONG!)`);
console.log(
  `'' === '' ? 'UTC' : ('' ?? 'default') → ${'' === '' ? 'UTC' : ('' ?? 'default')} (correct)`
);
console.log(`undefined ?? 'default' → ${undefined ?? 'default'} (correct)`);

// Existing implementations comparison
console.log('');
console.log('Comparing existing implementations:');
console.log('===================================');

// From daysUntil.ts (uses || which is WRONG for empty string)
function daysUntilVersion(userTimezone: string | undefined, defaultTimezone: string): string {
  return userTimezone === undefined ? defaultTimezone : userTimezone || 'UTC';
}

// From calculateDuration.ts (correct)
function calculateDurationVersion(timezone: string | undefined, defaultTimezone: string): string {
  if (timezone === '') return 'UTC';
  return timezone ?? defaultTimezone;
}

const implementations = [
  { name: 'daysUntil version (|| operator)', fn: daysUntilVersion },
  { name: 'calculateDuration version (explicit check)', fn: calculateDurationVersion },
  { name: 'proposed utility', fn: resolveTimezone },
];

console.log('Testing empty string handling:');
implementations.forEach(({ name, fn }) => {
  const result = fn('', systemTimezone);
  console.log(`  ${name}: "" → "${result}" ${result === 'UTC' ? '✓' : '✗ WRONG'}`);
});

console.log('');
console.log('Testing undefined handling:');
implementations.forEach(({ name, fn }) => {
  const result = fn(undefined, systemTimezone);
  console.log(`  ${name}: undefined → "${result}" ${result === systemTimezone ? '✓' : '✗ WRONG'}`);
});
