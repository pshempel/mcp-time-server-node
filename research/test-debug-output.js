#!/usr/bin/env node

/**
 * Test debug output for getBusinessDays
 * This shows what debug information is available when diagnosing issues
 */

// Set debug before requiring modules
process.env.DEBUG = 'mcp:business,mcp:holidays,mcp:validation,mcp:timezone,mcp:timing';

const { getBusinessDays } = require('../dist/tools/getBusinessDays');

console.log('=== Testing Debug Output for getBusinessDays ===\n');

console.log('Test 1: Venezuela business days (no country parameter)');
console.log('Expected: Debug should show no holiday information provided\n');

try {
  const result1 = getBusinessDays({
    start_date: '2025-01-01',
    end_date: '2025-01-05',
    timezone: 'America/Caracas',
  });

  console.log('\nResult:', JSON.stringify(result1, null, 2));
} catch (e) {
  console.error('Error:', e);
}

console.log('\n---\n');

console.log('Test 2: With explicit holidays');
console.log('Expected: Debug should show holidays being used\n');

try {
  const result2 = getBusinessDays({
    start_date: '2025-01-01',
    end_date: '2025-01-05',
    timezone: 'America/Caracas',
    holidays: ['2025-01-01'], // New Year's Day
  });

  console.log('\nResult:', JSON.stringify(result2, null, 2));
} catch (e) {
  console.error('Error:', e);
}

console.log('\n---\n');

console.log('Test 3: With holiday_calendar (currently not implemented)');
console.log('Expected: Debug should show attempting to use calendar\n');

try {
  const result3 = getBusinessDays({
    start_date: '2025-01-01',
    end_date: '2025-01-05',
    timezone: 'America/Caracas',
    holiday_calendar: 'VE', // Venezuela
  });

  console.log('\nResult:', JSON.stringify(result3, null, 2));
} catch (e) {
  console.error('Error:', e);
}

console.log('\n=== Test Complete ===');
console.log('\nKey observations:');
console.log('1. Debug output shows when no holiday information is provided');
console.log('2. Debug shows holiday aggregation process');
console.log('3. Debug can help identify missing country parameter support');
