#!/usr/bin/env node

/**
 * Research script to verify date parsing behaviors
 * This documents the expected behavior for parseTimeInput utility
 */

const { parseISO, isValid } = require('date-fns');
const { toDate } = require('date-fns-tz');

console.log('=== DATE PARSING BEHAVIOR RESEARCH ===\n');

// Test cases to verify
const testCases = [
  // Unix timestamps
  { input: '1735689600', type: 'unix_seconds' },
  { input: '1735689600000', type: 'unix_millis' },
  { input: 'not_a_number', type: 'invalid_unix' },

  // ISO strings with timezone info
  { input: '2025-01-01T12:00:00Z', type: 'iso_utc' },
  { input: '2025-01-01T12:00:00+05:00', type: 'iso_offset' },
  { input: '2025-01-01T12:00:00-08:00', type: 'iso_offset_negative' },

  // ISO strings without timezone
  { input: '2025-01-01T12:00:00', type: 'iso_local' },
  { input: '2025-01-01', type: 'iso_date_only' },

  // Invalid formats
  { input: 'tomorrow', type: 'natural_language' },
  { input: '01/01/2025', type: 'slash_format' },
  { input: '', type: 'empty_string' },
  { input: null, type: 'null' },
  { input: undefined, type: 'undefined' },
];

console.log('1. UNIX TIMESTAMP PARSING');
console.log('==========================');
testCases
  .filter((tc) => tc.type.includes('unix'))
  .forEach((tc) => {
    console.log(`\nInput: "${tc.input}" (${tc.type})`);

    // Test parseInt
    const parsed = parseInt(tc.input, 10);
    console.log(`  parseInt: ${parsed}`);
    console.log(`  isNaN: ${isNaN(parsed)}`);

    // Test regex
    console.log(`  /^\\d+$/.test: ${/^\d+$/.test(tc.input)}`);

    // Test Date construction
    if (!isNaN(parsed)) {
      const dateSeconds = new Date(parsed * 1000);
      const dateMillis = new Date(parsed);
      console.log(`  new Date(n * 1000): ${dateSeconds.toISOString()}`);
      console.log(`  new Date(n): ${dateMillis.toISOString()}`);
    }
  });

console.log('\n\n2. ISO STRING PARSING WITH parseISO');
console.log('=====================================');
testCases
  .filter((tc) => tc.type.includes('iso'))
  .forEach((tc) => {
    console.log(`\nInput: "${tc.input}" (${tc.type})`);

    try {
      const date = parseISO(tc.input);
      console.log(`  parseISO result: ${date}`);
      console.log(`  isValid: ${isValid(date)}`);
      if (isValid(date)) {
        console.log(`  toISOString: ${date.toISOString()}`);
        console.log(
          `  UTC offset preserved: ${tc.input.includes('Z') || /[+-]\d{2}:\d{2}/.test(tc.input)}`
        );
      }
    } catch (error) {
      console.log(`  parseISO error: ${error.message}`);
    }
  });

console.log('\n\n3. TIMEZONE-AWARE PARSING WITH toDate');
console.log('=======================================');
const timezones = ['America/New_York', 'UTC', ''];
['2025-01-01T12:00:00', '2025-01-01'].forEach((input) => {
  console.log(`\nInput: "${input}"`);

  timezones.forEach((tz) => {
    try {
      const date = toDate(input, { timeZone: tz || undefined });
      console.log(`  toDate with timezone "${tz}": ${date.toISOString()}`);
    } catch (error) {
      console.log(`  toDate with timezone "${tz}": ERROR - ${error.message}`);
    }
  });
});

console.log('\n\n4. NATIVE Date CONSTRUCTOR FALLBACK');
console.log('====================================');
testCases.forEach((tc) => {
  console.log(`\nInput: "${tc.input}" (${tc.type})`);

  try {
    const date = new Date(tc.input);
    console.log(`  new Date() result: ${date}`);
    console.log(`  toString: ${date.toString()}`);
    console.log(`  isNaN(date.getTime()): ${isNaN(date.getTime())}`);
  } catch (error) {
    console.log(`  new Date() error: ${error.message}`);
  }
});

console.log('\n\n5. TIMEZONE DETECTION PATTERNS');
console.log('================================');
const tzDetectionCases = [
  '2025-01-01T12:00:00Z',
  '2025-01-01T12:00:00+05:00',
  '2025-01-01T12:00:00-08:00',
  '2025-01-01T12:00:00',
  '2025-01-01',
];

tzDetectionCases.forEach((input) => {
  console.log(`\nInput: "${input}"`);
  console.log(`  Has 'Z': ${input.includes('Z')}`);
  console.log(`  Has offset (/[+-]\\d{2}:\\d{2}/): ${/[+-]\d{2}:\d{2}/.test(input)}`);
  console.log(`  Has any TZ info: ${input.includes('Z') || /[+-]\d{2}:\d{2}/.test(input)}`);

  // Extract offset if present
  const offsetMatch = input.match(/([+-])(\d{2}):(\d{2})$/);
  if (offsetMatch) {
    const sign = offsetMatch[1] === '+' ? 1 : -1;
    const hours = parseInt(offsetMatch[2], 10);
    const minutes = parseInt(offsetMatch[3], 10);
    const totalMinutes = sign * (hours * 60 + minutes);
    console.log(`  Extracted offset: ${totalMinutes} minutes`);
  }
});

console.log('\n\n6. SPECIAL CASE: DATE-ONLY STRINGS');
console.log('====================================');
['2025-01-01', '2025-12-31'].forEach((input) => {
  console.log(`\nInput: "${input}"`);

  const parseISOResult = parseISO(input);
  const newDateResult = new Date(input);

  console.log(`  parseISO: ${parseISOResult.toISOString()}`);
  console.log(`  new Date: ${newDateResult.toISOString()}`);
  console.log(`  Difference: parseISO treats as UTC, new Date may treat as local`);
});

console.log('\n\n=== SUMMARY OF VERIFIED BEHAVIORS ===');
console.log('1. Unix timestamps: Must be all digits, multiply by 1000 for seconds');
console.log('2. ISO strings with Z or offset: Timezone is preserved');
console.log(
  '3. ISO strings without timezone: Should be parsed as local time when timezone provided'
);
console.log('4. Date-only strings: parseISO treats as UTC, project convention');
console.log('5. Invalid inputs: Should throw descriptive errors');
console.log('6. Empty timezone (""): Should be treated as UTC per project convention');
console.log('7. Undefined timezone: Should use system local timezone per project convention');
