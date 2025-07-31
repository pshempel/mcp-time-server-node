#!/usr/bin/env node

/**
 * Verify the exact date parsing behavior from calculateDuration
 * This is critical to preserve during refactoring
 */

const { parseISO, isValid } = require('date-fns');
const { toDate } = require('date-fns-tz');

console.log('=== Date Parsing Behavior Verification ===\n');

// Test cases from the current implementation
const testCases = [
  // Unix timestamps
  { input: '1735689600', timezone: 'UTC', type: 'unix-string' },
  { input: '1735689600', timezone: 'America/New_York', type: 'unix-string' },
  
  // ISO with timezone info
  { input: '2025-01-01T12:00:00Z', timezone: 'America/New_York', type: 'iso-z' },
  { input: '2025-01-01T12:00:00-05:00', timezone: 'UTC', type: 'iso-offset' },
  { input: '2025-01-01T12:00:00+09:00', timezone: 'UTC', type: 'iso-offset' },
  
  // Local time strings (no Z or offset)
  { input: '2025-01-01T12:00:00', timezone: 'America/New_York', type: 'local-time' },
  { input: '2025-01-01T12:00:00', timezone: 'UTC', type: 'local-time' },
  { input: '2025-01-01', timezone: 'America/New_York', type: 'date-only' },
];

console.log('Current implementation logic:');
console.log('1. If string matches /^\\d+$/ → Unix timestamp');
console.log('2. Else if has timezone AND no Z AND no offset → toDate with timezone');
console.log('3. Else → parseISO\n');

testCases.forEach(({ input, timezone, type }) => {
  console.log(`\nTest: ${type} - "${input}" with timezone="${timezone}"`);
  
  try {
    let result;
    
    // Simulate current implementation logic
    if (/^\d+$/.test(input)) {
      // Unix timestamp
      const timestamp = parseInt(input, 10);
      if (isNaN(timestamp)) {
        throw new Error('Invalid Unix timestamp');
      }
      result = new Date(timestamp * 1000);
      console.log('  → Parsed as Unix timestamp');
    } else if (timezone && !input.includes('Z') && !/[+-]\d{2}:\d{2}/.test(input)) {
      // Local time with timezone parameter
      result = toDate(input, { timeZone: timezone });
      console.log(`  → Parsed with toDate in ${timezone}`);
    } else {
      // ISO string or has timezone info
      result = parseISO(input);
      console.log('  → Parsed with parseISO');
    }
    
    if (!isValid(result)) {
      throw new Error('Invalid date');
    }
    
    console.log(`  → Result: ${result.toISOString()}`);
    
    // Show the difference for local time interpretation
    if (type === 'local-time' || type === 'date-only') {
      const isoResult = parseISO(input);
      console.log(`  → parseISO would give: ${isoResult.toISOString()}`);
      if (result.getTime() !== isoResult.getTime()) {
        console.log('  → DIFFERENT! This is why we need toDate for local times');
      }
    }
    
  } catch (error) {
    console.log(`  → ERROR: ${error.message}`);
  }
});

console.log('\n=== Key Insights ===');
console.log('1. Unix timestamps are always in seconds (multiply by 1000)');
console.log('2. toDate interprets local time in the given timezone');
console.log('3. parseISO interprets date-only as start of day in LOCAL timezone');
console.log('4. ISO strings with Z or offset are absolute times');
console.log('5. The regex /[+-]\\d{2}:\\d{2}/ detects timezone offsets');