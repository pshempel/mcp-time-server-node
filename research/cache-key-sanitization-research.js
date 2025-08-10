#!/usr/bin/env node

/**
 * Research script for cache key sanitization
 *
 * Goals:
 * 1. Test potential security issues with unsanitized cache keys
 * 2. Explore SHA-256 hashing performance
 * 3. Determine best approach for key sanitization
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('=== Cache Key Sanitization Research ===\n');

// Test 1: Problematic cache keys
console.log('1. Testing problematic cache key patterns:');
const problematicKeys = [
  'normal_key',
  '../../../etc/passwd',
  'key\x00null_byte',
  'key\nwith\nnewlines',
  'key with spaces',
  'key/with/slashes',
  'key\\with\\backslashes',
  'key:with:colons',
  'key|with|pipes',
  'key?with?questions',
  'key*with*wildcards',
  'key<with>brackets',
  'key"with"quotes',
  "key'with'apostrophes",
  '🔑🌍📅 unicode emoji key',
  '\u202Ekey_with_rtl',
  'a'.repeat(300), // Long key
  '', // Empty key
  ' ', // Space only
  '.',
  '..',
];

console.log(`Testing ${problematicKeys.length} potentially problematic keys...\n`);

// Test filesystem safety
console.log('Filesystem safety test:');
const testDir = path.join(__dirname, 'cache-test');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
}

let filesystemIssues = 0;
for (const key of problematicKeys) {
  try {
    const filename = path.join(testDir, key);
    // Check if path escapes directory
    const resolvedPath = path.resolve(filename);
    const resolvedTestDir = path.resolve(testDir);

    if (!resolvedPath.startsWith(resolvedTestDir)) {
      console.log(`  ❌ Path traversal detected: "${key}"`);
      filesystemIssues++;
      continue;
    }

    // Try to use as filename
    fs.writeFileSync(filename, 'test', { flag: 'wx' });
    fs.unlinkSync(filename);
  } catch (err) {
    console.log(`  ❌ Filesystem issue with key: "${key}" - ${err.code || err.message}`);
    filesystemIssues++;
  }
}

// Cleanup
try {
  fs.rmdirSync(testDir);
} catch (err) {
  // Ignore cleanup errors
}

console.log(`\nFilesystem issues found: ${filesystemIssues}/${problematicKeys.length}\n`);

// Test 2: SHA-256 Performance
console.log('2. SHA-256 Hashing Performance Test:');

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Warm up
for (let i = 0; i < 1000; i++) {
  hashKey(`warmup_${i}`);
}

// Performance test
const iterations = 100000;
const testKeys = [
  'short',
  'medium_length_cache_key_example',
  'long_'.repeat(50),
  'unicode_🌍📅_key',
];

for (const testKey of testKeys) {
  const start = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    hashKey(testKey);
  }

  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1000000;
  const opsPerSec = Math.round(iterations / (durationMs / 1000));

  console.log(
    `  "${testKey.substring(0, 20)}..." - ${iterations} hashes in ${durationMs.toFixed(2)}ms (${opsPerSec.toLocaleString()} ops/sec)`,
  );
}

// Test 3: Hash collision probability
console.log('\n3. Hash Collision Test:');
const hashes = new Set();
const collisions = [];

for (let i = 0; i < 100000; i++) {
  const key = `test_key_${i}_${Math.random()}`;
  const hash = hashKey(key);

  if (hashes.has(hash)) {
    collisions.push({ key, hash });
  }
  hashes.add(hash);
}

console.log(`  Tested ${hashes.size} unique hashes`);
console.log(`  Collisions found: ${collisions.length}`);

// Test 4: Hash output characteristics
console.log('\n4. Hash Output Characteristics:');
const sampleHashes = problematicKeys.map((key) => ({
  key: key.substring(0, 30) + (key.length > 30 ? '...' : ''),
  hash: hashKey(key),
}));

console.log('  Sample hashes:');
sampleHashes.slice(0, 5).forEach(({ key, hash }) => {
  console.log(`    "${key}" -> ${hash}`);
});

// All hashes should be 64 chars (256 bits in hex)
const hashLengths = new Set(sampleHashes.map((h) => h.hash.length));
console.log(`\n  Hash lengths: ${Array.from(hashLengths).join(', ')} chars`);
console.log(
  `  All hashes are filesystem-safe: ${sampleHashes.every((h) => /^[a-f0-9]+$/.test(h.hash))}`,
);

// Test 5: Memory usage comparison
console.log('\n5. Memory Usage Comparison:');
const memBefore = process.memoryUsage();

// Store original keys
const originalCache = new Map();
for (let i = 0; i < 10000; i++) {
  const key = `complex_key_${i}_with_unicode_🌍_and_special_chars_!@#$%^&*()`;
  originalCache.set(key, { data: `value_${i}` });
}

const memAfterOriginal = process.memoryUsage();

// Store hashed keys
const hashedCache = new Map();
for (let i = 0; i < 10000; i++) {
  const key = `complex_key_${i}_with_unicode_🌍_and_special_chars_!@#$%^&*()`;
  const hashedKey = hashKey(key);
  hashedCache.set(hashedKey, { data: `value_${i}` });
}

const memAfterHashed = process.memoryUsage();

const originalMemUsed = (memAfterOriginal.heapUsed - memBefore.heapUsed) / 1024 / 1024;
const hashedMemUsed = (memAfterHashed.heapUsed - memAfterOriginal.heapUsed) / 1024 / 1024;

console.log(`  Original keys (10k entries): ${originalMemUsed.toFixed(2)} MB`);
console.log(`  Hashed keys (10k entries): ${hashedMemUsed.toFixed(2)} MB`);
console.log(`  Difference: ${(hashedMemUsed - originalMemUsed).toFixed(2)} MB`);

// Test 6: Recommended approach
console.log('\n6. Recommended Implementation:');
console.log('  - Use SHA-256 for all cache keys');
console.log('  - Hash provides consistent 64-char hex strings');
console.log('  - Eliminates all special character issues');
console.log('  - Minimal performance impact (<1μs per hash)');
console.log('  - Prevents path traversal and filesystem issues');
console.log('  - No practical collision risk for cache use case');

console.log('\n=== Research Complete ===');
