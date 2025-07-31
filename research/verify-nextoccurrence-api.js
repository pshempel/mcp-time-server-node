// Research script to verify exact nextOccurrence API behavior
// This will help ensure our wrapper maintains 100% compatibility

const { nextOccurrence } = require('../dist/tools/nextOccurrence.js');

console.log('=== NextOccurrence API Research ===\n');
console.log('Date:', new Date().toISOString());
console.log('Testing current nextOccurrence behavior...\n');

// Test 1: Basic daily pattern
console.log('--- Test 1: Basic Daily Pattern ---');
try {
  const result1 = nextOccurrence({
    pattern: 'daily',
    start_from: '2025-01-29T10:00:00Z',
  });
  console.log('Result:', JSON.stringify(result1, null, 2));
  console.log('✅ Basic daily works');
} catch (e) {
  console.log('❌ Error:', e.message);
}

// Test 2: Daily with time
console.log('\n--- Test 2: Daily with Time ---');
try {
  const result2 = nextOccurrence({
    pattern: 'daily',
    start_from: '2025-01-29T10:00:00Z',
    time: '14:30',
  });
  console.log('Result:', JSON.stringify(result2, null, 2));
  console.log('✅ Daily with time works');
} catch (e) {
  console.log('❌ Error:', e.message);
}

// Test 3: Weekly pattern
console.log('\n--- Test 3: Weekly Pattern ---');
try {
  const result3 = nextOccurrence({
    pattern: 'weekly',
    start_from: '2025-01-29T10:00:00Z',
    day_of_week: 1, // Monday
    time: '09:00',
  });
  console.log('Result:', JSON.stringify(result3, null, 2));
  console.log('✅ Weekly works');
} catch (e) {
  console.log('❌ Error:', e.message);
}

// Test 4: Monthly pattern
console.log('\n--- Test 4: Monthly Pattern ---');
try {
  const result4 = nextOccurrence({
    pattern: 'monthly',
    start_from: '2025-01-29T10:00:00Z',
    day_of_month: 15,
    time: '12:00',
  });
  console.log('Result:', JSON.stringify(result4, null, 2));
  console.log('✅ Monthly works');
} catch (e) {
  console.log('❌ Error:', e.message);
}

// Test 5: Yearly pattern
console.log('\n--- Test 5: Yearly Pattern ---');
try {
  const result5 = nextOccurrence({
    pattern: 'yearly',
    start_from: '2025-01-29T10:00:00Z',
    time: '00:00',
  });
  console.log('Result:', JSON.stringify(result5, null, 2));
  console.log('✅ Yearly works');
} catch (e) {
  console.log('❌ Error:', e.message);
}

// Test 6: Parameter mapping - snake_case in API
console.log('\n--- Test 6: Parameter Name Mapping ---');
const testParams = {
  pattern: 'weekly',
  start_from: '2025-01-29T10:00:00Z',
  day_of_week: 3,
};
console.log('Input params:', JSON.stringify(testParams, null, 2));
try {
  const result = nextOccurrence(testParams);
  console.log('Output:', JSON.stringify(result, null, 2));
  console.log('✅ Snake case parameters work');
} catch (e) {
  console.log('❌ Error:', e.message);
}

// Test 7: Timezone behavior
console.log('\n--- Test 7: Timezone Behavior ---');
const timezoneTests = [
  { tz: undefined, label: 'undefined (system)' },
  { tz: '', label: 'empty string (UTC)' },
  { tz: 'America/New_York', label: 'America/New_York' },
];

timezoneTests.forEach(({ tz, label }) => {
  try {
    const params = {
      pattern: 'daily',
      start_from: '2025-01-29T10:00:00Z',
      time: '14:30',
    };
    if (tz !== undefined) params.timezone = tz;

    const result = nextOccurrence(params);
    console.log(`  ${label}: ${result.next}`);
  } catch (e) {
    console.log(`  ${label}: ERROR - ${e.message}`);
  }
});

// Test 8: Caching behavior
console.log('\n--- Test 8: Caching Behavior ---');
const cacheParams = {
  pattern: 'daily',
  start_from: '2025-01-29T10:00:00Z',
};

console.time('First call');
const result1 = nextOccurrence(cacheParams);
console.timeEnd('First call');

console.time('Second call (cached)');
const result2 = nextOccurrence(cacheParams);
console.timeEnd('Second call (cached)');

console.log('Results match:', result1.next === result2.next);

console.log('\n=== Research Complete ===');
