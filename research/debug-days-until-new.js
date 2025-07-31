// Debug days_until calculation
const { nextOccurrence } = require('../dist/tools/nextOccurrence.js');
const { differenceInDays, startOfDay } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

// Mock date to Jan 15, 2025 10:30 UTC
const RealDate = Date;
global.Date = class extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      return new RealDate('2025-01-15T10:30:00Z');
    }
    return new RealDate(...args);
  }

  static now() {
    return new RealDate('2025-01-15T10:30:00Z').getTime();
  }
};

console.log('=== Debug Days Until Calculation ===\n');
console.log('Current mock date:', new Date().toISOString());
console.log('System timezone:', process.env.TZ || 'system default');

// Test 1: Monthly pattern - 20th of month
console.log('\n--- Test 1: Monthly 20th ---');
try {
  const result1 = nextOccurrence({
    pattern: 'monthly',
    day_of_month: 20,
  });
  console.log('Result:', JSON.stringify(result1, null, 2));
  console.log('Expected days_until: 5');
  console.log('Actual days_until:', result1.days_until);

  // Manual calculation
  const now = new Date();
  const next = new Date(result1.next);
  const nowStart = startOfDay(now);
  const nextStart = startOfDay(next);
  const manualDays = differenceInDays(nextStart, nowStart);
  console.log('\nManual calculation:');
  console.log('Now:', now.toISOString());
  console.log('Next:', next.toISOString());
  console.log('Now start of day:', nowStart.toISOString());
  console.log('Next start of day:', nextStart.toISOString());
  console.log('Manual days:', manualDays);
} catch (e) {
  console.log('Error:', e.message);
}

// Test 2: Monthly pattern - 31st
console.log('\n--- Test 2: Monthly 31st ---');
try {
  const result2 = nextOccurrence({
    pattern: 'monthly',
    day_of_month: 31,
  });
  console.log('Result:', JSON.stringify(result2, null, 2));
  console.log('Expected days_until: 16');
  console.log('Actual days_until:', result2.days_until);
} catch (e) {
  console.log('Error:', e.message);
}

// Test timezone handling
console.log('\n--- Test 3: Timezone Handling ---');
const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('System timezone:', systemTz);

// Check if running with UTC-5
const mockConfig = require('../dist/utils/config.js');
console.log('Config timezone:', mockConfig.getConfig().defaultTimezone);
