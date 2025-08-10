// Research: How to measure JavaScript object memory size
// Testing different approaches to get accurate memory measurements

const { inspect } = require('util');

// Test data structures
const testObjects = {
  simple: { time: '2025-01-01T12:00:00Z', timezone: 'UTC' },

  nested: {
    time: '2025-01-01T12:00:00Z',
    timezone: 'UTC',
    offset: { hours: 0, minutes: 0 },
    metadata: { cached: true, ttl: 300 },
  },

  array: {
    holidays: ['2025-01-01', '2025-12-25', '2025-07-04'],
    weekends: [0, 6],
    data: new Array(100).fill('test'),
  },

  typical_cache_entry: {
    time: '2025-07-19T21:47:01.132-04:00',
    timezone: 'America/New_York',
    offset: '-04:00',
    unix: 1752976021,
    iso: '2025-07-19T21:47:01.132-04:00',
  },
};

// Method 1: JSON stringify length (crude but consistent)
function sizeViaJSON(obj) {
  return JSON.stringify(obj).length;
}

// Method 2: Recursive property counting
function sizeViaRecursion(obj) {
  let size = 0;

  function calculate(obj) {
    if (obj === null) return 1;

    switch (typeof obj) {
      case 'boolean':
        return 4;
      case 'number':
        return 8;
      case 'string':
        return obj.length * 2; // UTF-16
      case 'object':
        if (Array.isArray(obj)) {
          size += 24; // Array overhead
          obj.forEach(calculate);
        } else {
          size += 24; // Object overhead
          for (let key in obj) {
            size += key.length * 2 + 8; // Key string + pointer
            calculate(obj[key]);
          }
        }
        break;
    }
  }

  calculate(obj);
  return size;
}

// Method 3: Using util.inspect
function sizeViaInspect(obj) {
  return inspect(obj, { compact: true }).length * 2;
}

// Method 4: Node.js process memory (for verification)
function testWithActualMemory() {
  const cache = new Map();
  const before = process.memoryUsage().heapUsed;

  // Add 1000 typical cache entries
  for (let i = 0; i < 1000; i++) {
    cache.set(`key_${i}`, {
      time: `2025-07-19T21:47:01.${i}Z`,
      timezone: 'America/New_York',
      offset: '-04:00',
      unix: 1752976021 + i,
      iso: `2025-07-19T21:47:01.${i}-04:00`,
    });
  }

  const after = process.memoryUsage().heapUsed;
  const totalSize = after - before;
  const perEntry = Math.round(totalSize / 1000);

  return { totalSize, perEntry, entries: 1000 };
}

// Run tests
console.log('=== JavaScript Object Memory Size Research ===\n');

// Test each method
Object.entries(testObjects).forEach(([name, obj]) => {
  console.log(`Object: ${name}`);
  console.log(`  JSON length: ${sizeViaJSON(obj)} bytes`);
  console.log(`  Recursive calc: ${sizeViaRecursion(obj)} bytes`);
  console.log(`  Inspect length: ${sizeViaInspect(obj)} bytes`);
  console.log('');
});

// Test with actual memory
console.log('=== Actual Memory Usage Test ===');
const memTest = testWithActualMemory();
console.log(`Added ${memTest.entries} cache entries`);
console.log(`Total memory increase: ${memTest.totalSize} bytes`);
console.log(`Average per entry: ${memTest.perEntry} bytes`);
console.log(`\nFor 10MB limit: ~${Math.floor((10 * 1024 * 1024) / memTest.perEntry)} entries`);

// Check if NodeCache tracks memory
const NodeCache = require('node-cache');
const cache = new NodeCache();

console.log('\n=== NodeCache Memory Tracking ===');
console.log('NodeCache methods:', Object.getOwnPropertyNames(NodeCache.prototype));
console.log('Has getStats:', typeof cache.getStats === 'function');
if (cache.getStats) {
  cache.set('test', testObjects.typical_cache_entry);
  console.log('Stats:', cache.getStats());
}
