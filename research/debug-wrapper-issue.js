// Debug wrapper issues
const { nextOccurrenceNew } = require('../dist/tools/nextOccurrenceNew.js');

console.log('=== Debug Wrapper Issues ===\n');

// Test 1: Weekly pattern with Wednesday
console.log('--- Test 1: Weekly Pattern (Wednesday) ---');
const params1 = {
  pattern: 'weekly',
  start_from: '2025-01-29T10:00:00Z', // Wednesday
  day_of_week: 3, // Wednesday
  time: '14:30',
};
console.log('Input:', JSON.stringify(params1, null, 2));

try {
  const result = nextOccurrenceNew(params1);
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('Start date is:', new Date('2025-01-29T10:00:00Z').toUTCString());
  console.log('Result date is:', new Date(result.next).toUTCString());
} catch (e) {
  console.log('Error:', e.message);
}

// Test 2: Check what the old implementation returns
console.log('\n--- Test 2: Compare with Old Implementation ---');
const { nextOccurrence } = require('../dist/tools/nextOccurrence.js');
try {
  const oldResult = nextOccurrence(params1);
  console.log('Old implementation:', JSON.stringify(oldResult, null, 2));
} catch (e) {
  console.log('Old implementation error:', e.message);
}

// Test 3: Monthly pattern
console.log('\n--- Test 3: Monthly Pattern (31st) ---');
const params2 = {
  pattern: 'monthly',
  start_from: '2025-01-29T10:00:00Z',
  day_of_month: 31,
};
console.log('Input:', JSON.stringify(params2, null, 2));

try {
  const result = nextOccurrenceNew(params2);
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('Result date is:', new Date(result.next).toUTCString());
} catch (e) {
  console.log('Error:', e.message);
}

// Test 4: days_until calculation
console.log('\n--- Test 4: Days Until Calculation ---');
const params3 = {
  pattern: 'daily',
  start_from: '2025-01-29T10:00:00Z',
};

try {
  const result = nextOccurrenceNew(params3);
  console.log('Next occurrence:', result.next);
  console.log('Days until:', result.days_until);
  console.log('System time:', new Date().toISOString());
} catch (e) {
  console.log('Error:', e.message);
}
