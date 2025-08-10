// Test timezone handling difference
const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock the config module
Module.prototype.require = function (id) {
  if (id.includes('utils/config')) {
    return {
      getConfig: () => ({ defaultTimezone: 'UTC' }),
    };
  }
  return originalRequire.apply(this, arguments);
};

const { nextOccurrence } = require('../dist/tools/nextOccurrence.js');

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

console.log('=== Test with UTC Default Timezone ===');
console.log('Current date:', new Date().toISOString());

// Test 1: Monthly pattern - 20th of month
console.log('\nTest 1: Monthly 20th (no timezone param)');
try {
  const result1 = nextOccurrence({
    pattern: 'monthly',
    day_of_month: 20,
  });
  console.log('Next:', result1.next);
  console.log('Expected days_until: 5');
  console.log('Actual days_until:', result1.days_until);
  console.log('Is UTC midnight?', result1.next.endsWith('T00:00:00.000Z'));
} catch (e) {
  console.log('Error:', e);
}

// Test with explicit empty string (should be UTC)
console.log('\nTest 2: Monthly 20th (timezone="")');
try {
  const result2 = nextOccurrence({
    pattern: 'monthly',
    day_of_month: 20,
    timezone: '',
  });
  console.log('Next:', result2.next);
  console.log('Expected days_until: 5');
  console.log('Actual days_until:', result2.days_until);
} catch (e) {
  console.log('Error:', e);
}
