#!/usr/bin/env npx tsx
/**
 * Test cache debug output
 *
 * Run with:
 *   DEBUG=mcp:cache npx tsx research/test-cache-debug.ts
 */

process.env.DEBUG = 'mcp:cache,mcp:error';

import { getCurrentTime } from '../src/tools/getCurrentTime';

console.log('\n=== Testing Cache Debug Output ===\n');

console.log('1. First call - should be MISS:');
const result1 = getCurrentTime({
  timezone: 'America/New_York',
  format: 'yyyy-MM-dd HH:mm:ss',
});
console.log('Result:', result1.time);

console.log('\n2. Second call - should be HIT:');
const result2 = getCurrentTime({
  timezone: 'America/New_York',
  format: 'yyyy-MM-dd HH:mm:ss',
});
console.log('Result:', result2.time);

console.log('\n3. Different params - should be MISS:');
const result3 = getCurrentTime({
  timezone: 'UTC',
  format: 'yyyy-MM-dd HH:mm:ss',
});
console.log('Result:', result3.time);

console.log('\n=== What This Shows ===');
console.log('- Cache key hashing (truncated for security)');
console.log('- Cache hits vs misses');
console.log('- TTL values being used');
console.log('- Any cache errors that occur');
