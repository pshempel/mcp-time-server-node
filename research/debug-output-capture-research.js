#!/usr/bin/env node

/**
 * Research: Understanding how debug outputs in Node.js
 * Goal: Find the right way to capture debug output in tests
 */

const debug = require('debug');

console.log('\n=== Research: Debug Output Mechanisms ===\n');

// 1. Check what debug uses for output
console.log('1. Checking debug output target:');
const testDebug = debug('test:output');

// Enable it
testDebug.enabled = true;
process.env.DEBUG = 'test:*';

// Check properties
console.log('   - testDebug.useColors:', testDebug.useColors);
console.log('   - testDebug.inspectOpts:', testDebug.inspectOpts);
console.log('   - Has log property:', typeof testDebug.log);

// 2. Test different capture methods
console.log('\n2. Testing capture methods:');

// Method A: Override debug.log
console.log('\n   A. Override debug.log:');
const originalLog = debug.log;
let capturedLog = '';
debug.log = function (...args) {
  capturedLog += args.join(' ') + '\n';
  originalLog.apply(this, args); // Still output normally
};

testDebug('Message via log override');
console.log('      Captured:', capturedLog.trim() || 'nothing');

// Method B: Override console.error
console.log('\n   B. Override console.error:');
const originalConsoleError = console.error;
let capturedConsole = '';
console.error = function (...args) {
  capturedConsole += args.join(' ') + '\n';
  originalConsoleError.apply(this, args);
};

const consoleDebug = debug('test:console');
consoleDebug.enabled = true;
consoleDebug('Message via console override');
console.error = originalConsoleError;
console.log('      Captured:', capturedConsole.includes('test:console') ? 'YES' : 'NO');

// Method C: Override process.stderr.write
console.log('\n   C. Override process.stderr.write:');
const originalWrite = process.stderr.write;
let capturedStderr = '';
process.stderr.write = function (chunk, encoding, callback) {
  capturedStderr += chunk.toString();
  return originalWrite.call(this, chunk, encoding, callback);
};

const stderrDebug = debug('test:stderr');
stderrDebug.enabled = true;
stderrDebug('Message via stderr override');
process.stderr.write = originalWrite;
console.log('      Captured:', capturedStderr.includes('test:stderr') ? 'YES' : 'NO');

// 3. Check default log function
console.log('\n3. Checking default log function:');
console.log('   - debug.log === console.error:', debug.log === console.error);
console.log('   - debug.log === console.log:', debug.log === console.log);
console.log(
  '   - debug.log is custom function:',
  debug.log !== console.error && debug.log !== console.log
);
console.log('   - debug.log.name:', debug.log.name || 'anonymous');

// 4. Test with TTY vs non-TTY
console.log('\n4. Testing TTY detection:');
console.log('   - process.stderr.isTTY:', process.stderr.isTTY);
console.log('   - process.stdout.isTTY:', process.stdout.isTTY);

// 5. Check if debug is actually outputting
console.log('\n5. Verifying debug output:');
debug.log = originalLog; // Reset
debug.enable('test:verify');
const verifyDebug = debug('test:verify');
console.log('   - verifyDebug.enabled:', verifyDebug.enabled);

// Try to force output
let sawOutput = false;
const tempLog = debug.log;
debug.log = function (...args) {
  sawOutput = true;
  tempLog.apply(this, args);
};
verifyDebug('Test output');
console.log('   - debug.log was called:', sawOutput);

// 6. Check environment
console.log('\n6. Environment check:');
console.log('   - NODE_ENV:', process.env.NODE_ENV);
console.log('   - DEBUG:', process.env.DEBUG);
console.log('   - CI:', process.env.CI);

// 7. Import our enhanced debug
console.log('\n7. Testing our enhanced debug:');
try {
  // Clear cache first
  const debugUtilPath = require.resolve('../src/utils/debug');
  const debugEnhancedPath = require.resolve('../src/utils/debugEnhanced');
  delete require.cache[debugUtilPath];
  delete require.cache[debugEnhancedPath];

  // Set env first
  process.env.DEBUG = 'mcp:*';

  const { debug: ourDebug } = require('../src/utils/debug');

  // Test if we can capture from it
  capturedLog = '';
  debug.log = function (...args) {
    capturedLog += args.join(' ') + '\n';
  };

  ourDebug.business('Business logic test');
  console.log(
    '   - Captured from ourDebug.business:',
    capturedLog.includes('Business') ? 'YES' : 'NO'
  );

  // Test auto-namespace
  ourDebug.log('Auto namespace test');
  console.log('   - Captured from ourDebug.log:', capturedLog.includes('Auto') ? 'YES' : 'NO');
} catch (e) {
  console.log('   - Error loading our debug:', e.message);
}

console.log('\n=== Research Complete ===\n');
console.log('Solution:');
console.log('- debug.log override DOES work for capturing');
console.log('- Must override BEFORE requiring modules that use debug');
console.log('- Our enhanced debug creates instances at module load time');
console.log('- Need to clear require cache AND override debug.log first');
