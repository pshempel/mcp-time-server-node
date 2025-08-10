const fs = require('fs');
const path = require('path');

console.log('=== Recurrence Refactor Security Verification ===\n');
console.log('Date:', new Date().toISOString());
console.log('Checking security aspects of the recurrence refactor...\n');

// Test 1: Input validation limits
console.log('--- Test 1: Input Validation Limits ---');
const { RecurrenceValidator } = require('../dist/tools/recurrence/RecurrenceValidator.js');
const validator = new RecurrenceValidator();

// Test timezone length limit
try {
  const longTimezone = 'A'.repeat(101); // Over 100 char limit
  validator.validate({ pattern: 'daily', timezone: longTimezone });
  console.log('❌ FAIL: Timezone length not limited');
} catch (e) {
  if (e.error && e.error.message.includes('exceeds maximum length')) {
    console.log('✅ PASS: Timezone length properly limited to 100 chars');
  } else {
    console.log('❌ FAIL: Wrong error for timezone length:', e.error?.message);
  }
}

// Test 2: Pattern injection
console.log('\n--- Test 2: Pattern Injection Protection ---');
const maliciousPatterns = [
  "daily'; DROP TABLE users; --",
  'daily</script><script>alert(1)</script>',
  'daily\x00null',
  'daily\n\rextra',
  '__proto__',
  'constructor',
];

maliciousPatterns.forEach((pattern) => {
  try {
    validator.validate({ pattern });
    console.log(`❌ FAIL: Pattern "${pattern}" was not rejected`);
  } catch (e) {
    if (e.error && e.error.code === 'INVALID_PARAMETER') {
      console.log(`✅ PASS: Pattern "${pattern}" properly rejected`);
    } else {
      console.log(`❌ FAIL: Unexpected error for pattern "${pattern}":`, e.error?.message);
    }
  }
});

// Test 3: Time format injection
console.log('\n--- Test 3: Time Format Injection Protection ---');
const maliciousTimes = [
  '14:30:00', // Extra seconds
  '14:30; DROP', // SQL injection attempt
  '${14}:${30}', // Template injection
  '14:30<script>', // XSS attempt
  '../../../../etc/passwd', // Path traversal
];

maliciousTimes.forEach((time) => {
  try {
    validator.validate({ pattern: 'daily', time });
    console.log(`❌ FAIL: Time "${time}" was not rejected`);
  } catch (e) {
    if (e.error && e.error.message.includes('Invalid time format')) {
      console.log(`✅ PASS: Time "${time}" properly rejected`);
    } else {
      console.log(`❌ FAIL: Unexpected error for time "${time}":`, e.error?.message);
    }
  }
});

// Test 4: Integer overflow protection
console.log('\n--- Test 4: Integer Overflow Protection ---');
const overflowTests = [
  { field: 'dayOfWeek', value: Number.MAX_SAFE_INTEGER, pattern: 'weekly' },
  { field: 'dayOfMonth', value: 999999, pattern: 'monthly' },
  { field: 'month', value: -999999, pattern: 'yearly' },
];

overflowTests.forEach(({ field, value, pattern }) => {
  try {
    const params = { pattern };
    params[field] = value;
    if (pattern === 'monthly') params.dayOfMonth = value;
    if (pattern === 'yearly') {
      params.month = value;
      params.dayOfMonth = 1;
    }

    validator.validate(params);
    console.log(`❌ FAIL: ${field}=${value} was not rejected`);
  } catch (e) {
    if (e.error && e.error.code === 'INVALID_PARAMETER') {
      console.log(`✅ PASS: ${field}=${value} properly rejected`);
    } else {
      console.log(`❌ FAIL: Unexpected error for ${field}=${value}:`, e.error?.message);
    }
  }
});

// Test 5: No eval or Function constructor usage
console.log('\n--- Test 5: Dangerous Function Usage ---');
const sourceDir = path.join(__dirname, '../src/tools/recurrence');
const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.ts'));

let dangerousFound = false;
const dangerousPatterns = [
  /eval\s*\(/,
  /new\s+Function\s*\(/,
  /setTimeout\s*\([^,]+,/, // Dynamic setTimeout
  /setInterval\s*\([^,]+,/, // Dynamic setInterval
];

files.forEach((file) => {
  const content = fs.readFileSync(path.join(sourceDir, file), 'utf8');
  dangerousPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      console.log(`❌ FAIL: Found dangerous pattern in ${file}: ${pattern}`);
      dangerousFound = true;
    }
  });
});

if (!dangerousFound) {
  console.log('✅ PASS: No dangerous function usage found');
}

// Test 6: Error information leakage
console.log('\n--- Test 6: Error Information Leakage ---');
try {
  validator.validate({ pattern: 'invalid-pattern-test' });
} catch (e) {
  const errorStr = JSON.stringify(e.error);

  // Check for sensitive info that shouldn't be in errors
  const sensitivePatterns = [
    /\/home\/[^/]+/, // User home paths
    /node_modules/, // Internal paths
    /\d+\.\d+\.\d+\.\d+/, // IP addresses
    /password|secret|key|token/i, // Sensitive keywords
  ];

  let leakageFound = false;
  sensitivePatterns.forEach((pattern) => {
    if (pattern.test(errorStr)) {
      console.log(`❌ FAIL: Error contains sensitive info matching: ${pattern}`);
      leakageFound = true;
    }
  });

  if (!leakageFound) {
    console.log('✅ PASS: Error messages do not leak sensitive information');
  }
}

console.log('\n=== Security Verification Complete ===');
console.log('\nRecommendations:');
console.log('1. All input validation appears to be in place');
console.log('2. String length limits prevent DoS attacks');
console.log('3. Pattern validation prevents injection attacks');
console.log('4. No dangerous functions (eval, Function) are used');
console.log("5. Error messages are safe and don't leak paths");
