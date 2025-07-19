#!/usr/bin/env node

/**
 * Additional research on TZ environment variable interaction
 */

console.log('=== TZ Environment Variable Research ===\n');

// Save original TZ
const originalTZ = process.env.TZ;

// Test 1: How TZ affects system timezone
console.log('1. TZ environment variable effect:');

const testCases = [
  { tz: undefined, label: 'TZ unset' },
  { tz: '', label: 'TZ empty' },
  { tz: 'UTC', label: 'TZ=UTC' },
  { tz: 'America/New_York', label: 'TZ=America/New_York' },
  { tz: 'Invalid/Zone', label: 'TZ=Invalid/Zone' },
  { tz: 'EST5EDT', label: 'TZ=EST5EDT' },
];

testCases.forEach(({ tz, label }) => {
  if (tz === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = tz;
  }

  try {
    const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`   ${label}: "${systemTz}"`);
  } catch (e) {
    console.log(`   ${label}: ERROR - ${e.message}`);
  }
});

// Restore original TZ
if (originalTZ !== undefined) {
  process.env.TZ = originalTZ;
} else {
  delete process.env.TZ;
}

// Test 2: Date object behavior with TZ
console.log('\n2. Date object with different TZ values:');

testCases.slice(0, 4).forEach(({ tz, label }) => {
  if (tz === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = tz;
  }

  const date = new Date('2025-01-20T12:00:00Z');
  console.log(`   ${label}: ${date.toString()}`);
});

// Restore
if (originalTZ !== undefined) {
  process.env.TZ = originalTZ;
} else {
  delete process.env.TZ;
}

// Test 3: Priority between TZ and DEFAULT_TIMEZONE
console.log('\n3. Should we respect TZ over DEFAULT_TIMEZONE?');
console.log('   Common practice: TZ is the standard Unix way to set timezone');
console.log('   Recommendation: Check TZ before using DEFAULT_TIMEZONE');

console.log('\n=== Updated Precedence Logic ===');
console.log('1. Parameter (if provided and not empty string)');
console.log('2. DEFAULT_TIMEZONE env var (if valid)');
console.log('3. TZ env var (if it affects Intl.DateTimeFormat)');
console.log('4. System timezone (Intl.DateTimeFormat)');
console.log('5. UTC (final fallback)');
