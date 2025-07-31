#!/usr/bin/env node

/**
 * Pre-commit test validator
 * Ensures all tests have assertions before allowing commit
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating tests for fake assertions...\n');

// Get list of test files that are staged for commit
let stagedFiles;
try {
  stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM')
    .toString()
    .split('\n')
    .filter((file) => file.endsWith('.test.ts') || file.endsWith('.test.js'))
    .filter(Boolean);
} catch (error) {
  console.log('Not in a git repository or no staged files');
  stagedFiles = [];
}

if (stagedFiles.length === 0) {
  console.log('No test files staged for commit');
  process.exit(0);
}

console.log(`Checking ${stagedFiles.length} test files...\n`);

let hasErrors = false;
const fakeTests = [];

// Check each staged test file
stagedFiles.forEach((file) => {
  if (!fs.existsSync(file)) return;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  let inTest = false;
  let testStartLine = 0;
  let testName = '';
  let hasExpect = false;
  let lineNumber = 0;

  lines.forEach((line, index) => {
    lineNumber = index + 1;

    // Check for test start
    const testMatch = line.match(/^\s*(it|test)\s*\(['"`](.*?)['"`]/);
    if (testMatch) {
      // If we were in a test, check if it had assertions
      if (inTest && !hasExpect) {
        fakeTests.push({
          file,
          line: testStartLine,
          name: testName,
        });
      }

      inTest = true;
      testStartLine = lineNumber;
      testName = testMatch[2];
      hasExpect = false;
    }

    // Check for expect
    if (inTest && line.includes('expect(')) {
      hasExpect = true;
    }

    // Check for test end
    if (inTest && line.match(/^\s*\}\s*\)\s*;?\s*$/)) {
      if (!hasExpect) {
        fakeTests.push({
          file,
          line: testStartLine,
          name: testName,
        });
      }
      inTest = false;
    }
  });
});

// Report results
if (fakeTests.length > 0) {
  console.error('❌ FAKE TESTS DETECTED!\n');
  console.error('The following tests have no assertions:\n');

  fakeTests.forEach((test) => {
    console.error(`  ${test.file}:${test.line} - "${test.name}"`);
  });

  console.error('\nPlease add assertions to these tests before committing.');
  console.error('A test without assertions is not a test!\n');

  hasErrors = true;
}

// Run ESLint on staged test files
if (!hasErrors && stagedFiles.length > 0) {
  console.log('Running ESLint on test files...\n');
  try {
    execSync(`npx eslint ${stagedFiles.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ All tests have proper assertions!\n');
  } catch (error) {
    console.error('❌ ESLint found issues in test files\n');
    hasErrors = true;
  }
}

process.exit(hasErrors ? 1 : 0);
