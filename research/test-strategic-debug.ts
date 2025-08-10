#!/usr/bin/env npx tsx
/**
 * Test strategic debug output
 *
 * Run with different DEBUG settings to see the new debug strategy in action:
 *   DEBUG=mcp:business:* npx tsx research/test-strategic-debug.ts
 *   DEBUG=mcp:decision:* npx tsx research/test-strategic-debug.ts
 *   DEBUG=mcp:* npx tsx research/test-strategic-debug.ts
 */

// Set debug namespace before importing
process.env.DEBUG = process.env.DEBUG || 'mcp:business:*,mcp:decision:*';

import { calculateBusinessHours } from '../src/tools/calculateBusinessHours';
import { getBusinessDays } from '../src/tools/getBusinessDays';

console.log('\n=== Testing Strategic Debug Output ===');
console.log('DEBUG=' + process.env.DEBUG);
console.log('=====================================\n');

console.log('1. Business Hours Calculation with holidays and partial days:');
const result1 = calculateBusinessHours({
  start_time: '2025-01-13T14:30:00', // Monday 2:30 PM
  end_time: '2025-01-17T10:30:00', // Friday 10:30 AM
  timezone: 'America/New_York',
  holidays: ['2025-01-15'], // Wednesday is holiday
  include_weekends: false,
  business_hours: {
    start: { hour: 9, minute: 0 },
    end: { hour: 17, minute: 0 },
  },
});
console.log('Result:', result1.total_business_hours, 'hours\n');

console.log('2. Business Days with calendar holidays:');
const result2 = getBusinessDays({
  start_date: '2025-12-20',
  end_date: '2025-12-31',
  holiday_calendar: 'US',
  exclude_weekends: true,
});
console.log('Result:', result2.business_days, 'business days\n');

console.log('\n=== Debug Output Above Shows: ===');
console.log('- Context at calculation start');
console.log('- Decisions about excluding days');
console.log('- Partial day calculations');
console.log('- Holiday processing');
console.log('- Summary of results');
