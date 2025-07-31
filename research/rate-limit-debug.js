#!/usr/bin/env node
/**
 * Debug why rate limiting isn't working
 */

import { SlidingWindowRateLimiter } from '../dist/utils/rateLimit.js';

console.log('=== Rate Limiter Debug ===\n');

// Test 1: Direct instantiation
console.log('Test 1: Direct instantiation with values');
const limiter1 = new SlidingWindowRateLimiter(2, 60000);
console.log('Limiter info:', limiter1.getInfo());

// Test 2: Environment variables
console.log('\nTest 2: Environment variables');
process.env.RATE_LIMIT = '2';
process.env.RATE_LIMIT_WINDOW = '60000';
console.log('Set env vars: RATE_LIMIT=2, RATE_LIMIT_WINDOW=60000');

const limiter2 = new SlidingWindowRateLimiter();
console.log('Limiter info:', limiter2.getInfo());

// Test 3: Check limits
console.log('\nTest 3: Testing rate limiting');
for (let i = 1; i <= 4; i++) {
  const allowed = limiter2.checkLimit();
  const info = limiter2.getInfo();
  console.log(
    `Request ${i}: ${allowed ? 'ALLOWED' : 'BLOCKED'} - current: ${info.current}/${info.limit}`,
  );
}

// Test 4: Server initialization
console.log('\nTest 4: Checking server initialization order');
console.log('process.env.RATE_LIMIT:', process.env.RATE_LIMIT);
console.log('parseInt result:', parseInt(process.env.RATE_LIMIT, 10));

// Test 5: Module load order
console.log('\nTest 5: When is rate limiter created?');
console.log('This test would need to be in the actual server code...');
