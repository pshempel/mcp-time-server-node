#!/usr/bin/env node

/**
 * Research script to test environment variable handling in rate limiter
 */

// Test 1: Direct environment variable usage
console.log('=== Test 1: Direct Environment Variables ===');
process.env.RATE_LIMIT = '200';
process.env.RATE_LIMIT_WINDOW = '120000';

console.log('Set RATE_LIMIT:', process.env.RATE_LIMIT);
console.log('Set RATE_LIMIT_WINDOW:', process.env.RATE_LIMIT_WINDOW);

// Import after setting env vars
const { SlidingWindowRateLimiter } = require('../dist/utils/rateLimit');

const limiter1 = new SlidingWindowRateLimiter();
const info1 = limiter1.getInfo();
console.log('Rate limiter info:', info1);
console.log('Expected limit: 200, actual:', info1.limit);
console.log('Expected window: 120000, actual:', info1.window);

// Test 2: Default values (no env vars)
console.log('\n=== Test 2: Default Values (no env vars) ===');
delete process.env.RATE_LIMIT;
delete process.env.RATE_LIMIT_WINDOW;

const limiter2 = new SlidingWindowRateLimiter();
const info2 = limiter2.getInfo();
console.log('Rate limiter info:', info2);
console.log('Expected limit: 100, actual:', info2.limit);
console.log('Expected window: 60000, actual:', info2.window);

// Test 3: Constructor parameters override env vars
console.log('\n=== Test 3: Constructor Parameters Override ===');
process.env.RATE_LIMIT = '200';
process.env.RATE_LIMIT_WINDOW = '120000';

const limiter3 = new SlidingWindowRateLimiter(50, 30000);
const info3 = limiter3.getInfo();
console.log('Rate limiter info:', info3);
console.log('Expected limit: 50, actual:', info3.limit);
console.log('Expected window: 30000, actual:', info3.window);

// Test 4: Invalid env var values
console.log('\n=== Test 4: Invalid Environment Variables ===');
process.env.RATE_LIMIT = 'invalid';
process.env.RATE_LIMIT_WINDOW = 'notanumber';

try {
  const limiter4 = new SlidingWindowRateLimiter();
  const info4 = limiter4.getInfo();
  console.log('Rate limiter info:', info4);
  console.log('Should use defaults when parsing fails');
} catch (error) {
  console.error('Error creating rate limiter:', error);
}

// Test 5: Check if getInfo() is actually available
console.log('\n=== Test 5: Available Methods ===');
const testLimiter = new SlidingWindowRateLimiter();
console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(testLimiter)));
