// Research: NodeCache built-in memory tracking
const NodeCache = require('node-cache');

// Test NodeCache's memory tracking accuracy
const cache = new NodeCache({
  stdTTL: 0, // No expiry for testing
  checkperiod: 0, // No automatic deletion
});

console.log('=== NodeCache Memory Tracking Research ===\n');

// Test 1: Empty cache
console.log('1. Empty cache stats:');
console.log(cache.getStats());

// Test 2: Add single entry
const testEntry = {
  time: '2025-07-19T21:47:01.132-04:00',
  timezone: 'America/New_York',
  offset: '-04:00',
  unix: 1752976021,
  iso: '2025-07-19T21:47:01.132-04:00',
};

cache.set('test1', testEntry);
console.log('\n2. After adding one entry:');
console.log(cache.getStats());
console.log(`   vsize represents: ${cache.getStats().vsize} bytes`);

// Test 3: Add more entries
for (let i = 2; i <= 10; i++) {
  cache.set(`test${i}`, { ...testEntry, unix: testEntry.unix + i });
}
console.log('\n3. After 10 entries:');
const stats10 = cache.getStats();
console.log(stats10);
console.log(`   Average vsize per entry: ${stats10.vsize / stats10.keys} bytes`);

// Test 4: Different sized values
cache.set('small', { a: 1 });
cache.set('large', {
  data: Array(100).fill('x'.repeat(10)),
  nested: { deep: { deeper: { data: 'test' } } },
});

console.log('\n4. After mixed sizes:');
const statsMixed = cache.getStats();
console.log(statsMixed);

// Test 5: Check if vsize updates on delete
cache.del('large');
console.log('\n5. After deleting large entry:');
console.log(cache.getStats());

// Test 6: Verify vsize calculation method
console.log('\n6. Testing vsize calculation:');
const vsizeBefore = cache.getStats().vsize;
const bigObject = { bigData: 'x'.repeat(1000) };
cache.set('big', bigObject);
const vsizeAfter = cache.getStats().vsize;
const vsizeDiff = vsizeAfter - vsizeBefore;

console.log(`   Object size via JSON: ${JSON.stringify(bigObject).length} bytes`);
console.log(`   vsize difference: ${vsizeDiff} bytes`);
console.log(`   Ratio: ${(vsizeDiff / JSON.stringify(bigObject).length).toFixed(2)}x`);

// Test 7: Maximum cache size
console.log('\n7. Memory usage for 10MB:');
const bytesPerEntry = statsMixed.vsize / statsMixed.keys;
const entriesFor10MB = Math.floor((10 * 1024 * 1024) / bytesPerEntry);
console.log(`   At ${Math.round(bytesPerEntry)} bytes per entry`);
console.log(`   10MB can hold ~${entriesFor10MB} entries`);

// Test 8: Investigate internal implementation
console.log('\n8. NodeCache internals:');
console.log(
  `   Uses JSON.stringify for vsize: ${cache._getValLength.toString().includes('JSON.stringify')}`,
);

// Create a cache entry and check internal storage
cache.set('internal_test', { test: true });
const internalData = cache.data || cache._data || {};
console.log(`   Internal data keys: ${Object.keys(internalData).slice(0, 5).join(', ')}...`);

// Print actual implementation
console.log('\n9. _getValLength implementation:');
console.log(cache._getValLength.toString());
