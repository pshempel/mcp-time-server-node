#!/usr/bin/env node

/**
 * Test if our debug capture actually works
 */

// First, override debug.log BEFORE requiring anything else
const debug = require('debug');
let capturedOutput = '';

const originalLog = debug.log;
debug.log = function (...args) {
  capturedOutput += args.join(' ') + '\n';
  originalLog.apply(this, args); // Also output normally for debugging
};

// Enable debug
debug.enable('mcp:*');

// Now require our modules
const { validateFormatParams } = require('../dist/tools/formatTime');

console.log('=== Testing Debug Capture ===\n');

// Test 1: Direct debug call
console.log('1. Direct debug call:');
const testDebug = debug('mcp:test');
testDebug('Direct test message');
console.log('   Captured:', capturedOutput.includes('Direct test') ? 'YES' : 'NO');

// Test 2: Call our function
console.log('\n2. Call validateFormatParams:');
capturedOutput = ''; // Reset
try {
  validateFormatParams({ format: 'relative', time: '2025-01-01' });
} catch (e) {
  // Ignore errors, we're testing debug output
}
console.log(
  '   Captured anything:',
  capturedOutput.length > 0 ? `YES (${capturedOutput.length} chars)` : 'NO'
);
console.log('   Contains "validation":', capturedOutput.includes('validation') ? 'YES' : 'NO');
console.log(
  '   Contains "validateFormatParams":',
  capturedOutput.includes('validateFormatParams') ? 'YES' : 'NO'
);

// Test 3: Show what was captured
if (capturedOutput) {
  console.log('\n3. Captured output:');
  console.log('---START---');
  console.log(capturedOutput);
  console.log('---END---');
}

// Test 4: Check if formatTime has debug statements at all
console.log('\n4. Checking formatTime debug usage:');
const fs = require('fs');
const formatTimePath = require.resolve('../dist/tools/formatTime');
const formatTimeSource = fs.readFileSync(formatTimePath, 'utf8');
const hasDebugValidation = formatTimeSource.includes('debug.validation');
const hasDebugTiming = formatTimeSource.includes('debug.timing');
const hasDebugParse = formatTimeSource.includes('debug.parse');
console.log('   Has debug.validation:', hasDebugValidation ? 'YES' : 'NO');
console.log('   Has debug.timing:', hasDebugTiming ? 'YES' : 'NO');
console.log('   Has debug.parse:', hasDebugParse ? 'YES' : 'NO');

console.log('\n=== Test Complete ===');
