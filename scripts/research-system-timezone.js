#!/usr/bin/env node

/**
 * Research script to verify system timezone detection behavior
 * This will help us understand how to properly implement the feature
 */

console.log('=== System Timezone Detection Research ===\n');

// Test 1: Basic Intl.DateTimeFormat behavior
console.log('1. Basic Intl.DateTimeFormat().resolvedOptions().timeZone:');
try {
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log(`   Result: "${systemTimezone}"`);
  console.log(`   Type: ${typeof systemTimezone}`);
  console.log(`   Valid: ${systemTimezone && systemTimezone.length > 0}\n`);
} catch (error) {
  console.log(`   ERROR: ${error.message}\n`);
}

// Test 2: Node.js version compatibility
console.log('2. Node.js version:');
console.log(`   Version: ${process.version}`);
console.log(`   Platform: ${process.platform}\n`);

// Test 3: Environment variable behavior
console.log('3. Environment variable testing:');

// Test undefined
delete process.env.DEFAULT_TIMEZONE;
console.log(`   DEFAULT_TIMEZONE undefined: ${process.env.DEFAULT_TIMEZONE}`);
console.log(`   Type: ${typeof process.env.DEFAULT_TIMEZONE}`);

// Test empty string
process.env.DEFAULT_TIMEZONE = '';
console.log(`   DEFAULT_TIMEZONE empty: "${process.env.DEFAULT_TIMEZONE}"`);
console.log(`   Type: ${typeof process.env.DEFAULT_TIMEZONE}`);

// Test valid timezone
process.env.DEFAULT_TIMEZONE = 'America/New_York';
console.log(`   DEFAULT_TIMEZONE valid: "${process.env.DEFAULT_TIMEZONE}"`);

// Test invalid timezone
process.env.DEFAULT_TIMEZONE = 'Invalid/Zone';
console.log(`   DEFAULT_TIMEZONE invalid: "${process.env.DEFAULT_TIMEZONE}"\n`);

// Test 4: Timezone validation with date-fns-tz
console.log('4. Timezone validation with date-fns-tz:');
const { getTimezoneOffset } = require('date-fns-tz');

function isValidTimezone(tz) {
  try {
    const offset = getTimezoneOffset(tz, new Date());
    return !isNaN(offset);
  } catch (e) {
    return false;
  }
}

const testTimezones = [
  Intl.DateTimeFormat().resolvedOptions().timeZone,
  'America/New_York',
  'Invalid/Zone',
  '',
  undefined,
  null,
];

testTimezones.forEach((tz) => {
  console.log(`   "${tz}": ${isValidTimezone(tz) ? 'valid' : 'invalid'}`);
});

// Test 5: Precedence logic simulation
console.log('\n5. Precedence logic simulation:');

function getDefaultTimezone(paramTimezone, envTimezone, systemTimezone) {
  // Parameter takes precedence (but empty string means UTC for backward compatibility)
  if (paramTimezone !== undefined) {
    return paramTimezone === '' ? 'UTC' : paramTimezone;
  }

  // Environment variable next
  if (envTimezone && envTimezone !== '' && isValidTimezone(envTimezone)) {
    return envTimezone;
  }

  // System timezone
  if (systemTimezone && isValidTimezone(systemTimezone)) {
    return systemTimezone;
  }

  // Final fallback
  return 'UTC';
}

const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const scenarios = [
  { param: 'Asia/Tokyo', env: 'America/New_York', expected: 'Asia/Tokyo' },
  { param: undefined, env: 'America/New_York', expected: 'America/New_York' },
  { param: undefined, env: undefined, expected: systemTz },
  { param: undefined, env: 'Invalid/Zone', expected: systemTz },
  { param: '', env: 'America/New_York', expected: 'UTC' }, // Backward compatibility
  { param: undefined, env: '', expected: systemTz },
];

scenarios.forEach(({ param, env, expected }) => {
  const result = getDefaultTimezone(param, env, systemTz);
  console.log(`   param="${param}", env="${env}" => "${result}" (expected: "${expected}")`);
});

// Test 6: Edge cases
console.log('\n6. Edge cases:');

// Test with TZ environment variable (common on Unix systems)
const originalTZ = process.env.TZ;
process.env.TZ = 'America/Chicago';
console.log(`   With TZ=America/Chicago: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
delete process.env.TZ;
console.log(`   Without TZ: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
if (originalTZ) process.env.TZ = originalTZ;

// Test 7: Performance check
console.log('\n7. Performance check:');
const iterations = 10000;

console.time('   Intl.DateTimeFormat resolution');
for (let i = 0; i < iterations; i++) {
  Intl.DateTimeFormat().resolvedOptions().timeZone;
}
console.timeEnd('   Intl.DateTimeFormat resolution');

console.time('   Cached access');
const cachedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
for (let i = 0; i < iterations; i++) {
  const tz = cachedTz;
}
console.timeEnd('   Cached access');

console.log('\n=== Research Complete ===');
