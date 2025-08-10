// Test with UTC timezone like the tests do
process.env.TZ = 'UTC';

const { nextOccurrence } = require('../dist/tools/nextOccurrence.js');

// Mock config to return UTC
jest.mock('../dist/utils/config.js', () => ({
  getConfig: jest.fn().mockReturnValue({
    defaultTimezone: 'UTC',
  }),
}));

// Mock date to Jan 15, 2025 10:30 UTC
const RealDate = Date;
global.Date = class extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      return new RealDate('2025-01-15T10:30:00.000Z');
    }
    return new RealDate(...args);
  }

  static now() {
    return new RealDate('2025-01-15T10:30:00.000Z').getTime();
  }
};

console.log('=== Test with UTC Configuration ===');
console.log('Current date:', new Date().toISOString());

// Test 1: Monthly pattern - 20th of month
console.log('\nTest 1: Monthly 20th');
try {
  const result1 = nextOccurrence({
    pattern: 'monthly',
    day_of_month: 20,
  });
  console.log('Next:', result1.next);
  console.log('Expected days_until: 5');
  console.log('Actual days_until:', result1.days_until);
} catch (e) {
  console.log('Error:', e);
}

// Test 2: Monthly pattern - 31st
console.log('\nTest 2: Monthly 31st');
try {
  const result2 = nextOccurrence({
    pattern: 'monthly',
    day_of_month: 31,
  });
  console.log('Next:', result2.next);
  console.log('Expected days_until: 16');
  console.log('Actual days_until:', result2.days_until);
} catch (e) {
  console.log('Error:', e);
}
