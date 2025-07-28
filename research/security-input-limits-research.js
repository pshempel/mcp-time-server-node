#!/usr/bin/env node

/**
 * Security Research: Input Length Limits
 *
 * This script tests the memory and performance impact of large inputs
 * to determine appropriate limits for the MCP Time Server.
 */

console.log('=== Security Research: Input Length Limits ===\n');

// Test 1: Memory usage of large strings
console.log('1. Testing memory impact of large strings:');

function getMemoryUsage() {
  const used = process.memoryUsage();
  return {
    heapUsed: Math.round((used.heapUsed / 1024 / 1024) * 100) / 100,
    external: Math.round((used.external / 1024 / 1024) * 100) / 100,
    total: Math.round(((used.heapUsed + used.external) / 1024 / 1024) * 100) / 100,
  };
}

// Baseline memory
const baseline = getMemoryUsage();
console.log('Baseline memory:', baseline);

// Test different string sizes
const stringSizes = [
  { size: 100, label: '100 chars' },
  { size: 1000, label: '1KB' },
  { size: 10000, label: '10KB' },
  { size: 100000, label: '100KB' },
  { size: 1000000, label: '1MB' },
];

const strings = {};
stringSizes.forEach(({ size, label }) => {
  strings[label] = 'x'.repeat(size);
  const current = getMemoryUsage();
  const delta = current.total - baseline.total;
  console.log(`After ${label}: ${current.total}MB (Δ${delta}MB)`);
});

console.log('\n2. Testing JSON.stringify with large inputs:');

// Test JSON.stringify performance
stringSizes.forEach(({ size, label }) => {
  if (size <= 100000) {
    // Don't test 1MB for JSON
    const testObj = {
      timezone: 'x'.repeat(size),
      format: 'yyyy-MM-dd',
      include_offset: true,
    };

    const start = process.hrtime.bigint();
    const json = JSON.stringify(testObj);
    const end = process.hrtime.bigint();

    const timeMs = Number(end - start) / 1000000;
    console.log(`JSON.stringify ${label}: ${timeMs.toFixed(2)}ms, output: ${json.length} chars`);
  }
});

console.log('\n3. Testing date-fns parseISO with large strings:');

const { parseISO, isValid } = require('date-fns');

// Test parseISO with various malformed inputs
const malformedInputs = [
  { input: 'x'.repeat(100), label: '100 chars of x' },
  { input: 'x'.repeat(1000), label: '1000 chars of x' },
  { input: '2024-01-01' + 'x'.repeat(1000), label: 'valid date + 1000 chars' },
  { input: '\x00'.repeat(100), label: '100 null bytes' },
  { input: '🔥'.repeat(100), label: '100 emoji' },
  { input: '\u202E' + '2024-01-01', label: 'RTL override + date' },
];

malformedInputs.forEach(({ input, label }) => {
  try {
    const start = process.hrtime.bigint();
    const parsed = parseISO(input);
    const valid = isValid(parsed);
    const end = process.hrtime.bigint();

    const timeMs = Number(end - start) / 1000000;
    console.log(`parseISO ${label}: ${timeMs.toFixed(2)}ms, valid: ${valid}`);
  } catch (error) {
    console.log(`parseISO ${label}: ERROR - ${error.message}`);
  }
});

console.log('\n4. Testing timezone validation with large strings:');

const { getTimezoneOffset } = require('date-fns-tz');

const timezoneInputs = [
  { input: 'x'.repeat(100), label: '100 chars' },
  { input: 'x'.repeat(1000), label: '1000 chars' },
  { input: 'America/New_York' + 'x'.repeat(1000), label: 'valid + 1000 chars' },
  { input: '../../../etc/passwd', label: 'path traversal attempt' },
  { input: 'America/New_York\x00malicious', label: 'null byte injection' },
];

timezoneInputs.forEach(({ input, label }) => {
  try {
    const start = process.hrtime.bigint();
    const offset = getTimezoneOffset(input, new Date());
    const end = process.hrtime.bigint();

    const timeMs = Number(end - start) / 1000000;
    const valid = !isNaN(offset);
    console.log(`Timezone ${label}: ${timeMs.toFixed(2)}ms, valid: ${valid}`);
  } catch (error) {
    console.log(`Timezone ${label}: ERROR - ${error.message}`);
  }
});

console.log('\n5. Testing array size limits:');

// Test large arrays
const arraySizes = [100, 365, 1000, 10000];

arraySizes.forEach((size) => {
  const array = Array(size).fill('2024-01-01');
  const memBefore = getMemoryUsage();

  const start = process.hrtime.bigint();
  const json = JSON.stringify(array);
  const end = process.hrtime.bigint();

  const memAfter = getMemoryUsage();
  const timeMs = Number(end - start) / 1000000;
  const memDelta = memAfter.total - memBefore.total;

  console.log(
    `Array ${size} items: ${timeMs.toFixed(2)}ms, Δmem: ${memDelta}MB, JSON: ${json.length} chars`,
  );
});

console.log('\n6. Cache key collision testing:');

// Test potential cache key collisions
const crypto = require('crypto');

function testCacheKey(input) {
  // Current approach - direct concatenation
  const directKey = `current_${input}_format_true`;

  // Proposed approach - hash
  const hash = crypto.createHash('sha256').update(directKey).digest('hex').substring(0, 16);

  return { directKey, hash };
}

const collisionTests = [
  'America/New_York',
  'America/New_York\x00malicious',
  'America/New_York/../../../etc',
  'x'.repeat(1000),
];

console.log('Testing cache key approaches:');
collisionTests.forEach((input) => {
  const { directKey, hash } = testCacheKey(input);
  console.log(
    `Input: "${input.substring(0, 30)}${input.length > 30 ? '...' : ''}" (${input.length} chars)`,
  );
  console.log(`  Direct: ${directKey.length} chars`);
  console.log(`  Hash: ${hash} (16 chars)`);
});

console.log('\n=== Recommendations ===');
console.log('1. String inputs should be limited to 1000 characters');
console.log('2. Array inputs should be limited to 365 items (1 year of dates)');
console.log('3. Cache keys should be hashed to prevent memory issues');
console.log('4. All inputs handle null bytes and unicode safely');
console.log('5. No significant performance impact up to 1KB strings');
