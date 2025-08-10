// Debug days_until calculation
const { nextOccurrence } = require('../dist/tools/nextOccurrence.js');

// Mock date to Jan 15, 2025
const RealDate = Date;
global.Date = class extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      return new RealDate('2025-01-15T10:00:00Z');
    }
    return new RealDate(...args);
  }

  static now() {
    return new RealDate('2025-01-15T10:00:00Z').getTime();
  }
};

console.log('=== Debug Days Until Calculation ===\n');
console.log('Current mock date:', new Date().toISOString());

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

// Test 3: Check timezone used
console.log('\n--- Test 3: Check Timezone ---');
console.log('System timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
