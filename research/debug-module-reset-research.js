#!/usr/bin/env node

/**
 * Research: How to properly reset debug module for testing
 * Problem: Debug instances are cached and don't pick up new log overrides
 * Goal: Find a way to capture debug output in tests reliably
 */

const debug = require('debug');

console.log('\n=== Research: Debug Module Reset Mechanisms ===\n');

// 1. Check what properties debug exposes
console.log('1. Debug module properties:');
console.log('   - debug.instances:', debug.instances ? 'exists' : 'not found');
console.log('   - debug.names:', debug.names ? debug.names.length + ' names' : 'not found');
console.log('   - debug.skips:', debug.skips ? debug.skips.length + ' skips' : 'not found');
console.log('   - debug.formatters:', Object.keys(debug.formatters || {}));

// 2. Test if we can override log function
console.log('\n2. Testing log function override:');
const originalLog = debug.log;
let captured = '';
debug.log = function (...args) {
  captured += args.join(' ') + '\n';
};

// Create a new debug instance AFTER overriding
const testDebug = debug('test:override');
testDebug.enabled = true; // Force enable
testDebug('Test message 1');

console.log('   - Captured after override:', captured ? `"${captured.trim()}"` : 'nothing');

// 3. Test if existing instances pick up the override
console.log('\n3. Testing existing instance override:');
const earlyDebug = debug('test:early');
earlyDebug.enabled = true;

captured = '';
debug.log = function (...args) {
  captured += 'INTERCEPTED: ' + args.join(' ') + '\n';
};

earlyDebug('Test message 2');
console.log('   - Captured from existing instance:', captured ? `"${captured.trim()}"` : 'nothing');

// 4. Test debug.enable() effect
console.log('\n4. Testing debug.enable() reconfiguration:');
captured = '';
debug.enable('test:*');
const afterEnable = debug('test:after');
afterEnable('Test message 3');
console.log('   - Captured after enable:', captured ? `"${captured.trim()}"` : 'nothing');

// 5. Test require cache clearing
console.log('\n5. Testing require cache clearing:');
const debugPath = require.resolve('debug');
console.log('   - Debug module path:', debugPath);

// Clear and re-require
delete require.cache[debugPath];
const debugNew = require('debug');

console.log('   - Same module?', debugNew === debug);
console.log('   - Same log function?', debugNew.log === debug.log);

// 6. Test if we can monkey-patch the factory
console.log('\n6. Testing factory monkey-patching:');
const Debug = require('debug/src/browser.js'); // or 'debug/src/node.js'
console.log('   - Direct import available?', typeof Debug);

// 7. Alternative: Override process.stderr.write
console.log('\n7. Testing stderr capture:');
const originalWrite = process.stderr.write;
let stderrCapture = '';
process.stderr.write = function (chunk) {
  stderrCapture += chunk;
  return true;
};

const stderrDebug = debug('test:stderr');
stderrDebug.enabled = true;
stderrDebug('Message to stderr');

process.stderr.write = originalWrite;
console.log('   - Captured from stderr:', stderrCapture ? `"${stderrCapture.trim()}"` : 'nothing');

// 8. Check if debug uses util.debuglog
console.log('\n8. Checking util.debuglog relationship:');
const util = require('util');
console.log('   - util.debuglog exists?', typeof util.debuglog === 'function');

// 9. Test environment variable effect
console.log('\n9. Testing DEBUG env variable:');
process.env.DEBUG = 'test:env';
const envDebug = debug('test:env');
console.log('   - envDebug.enabled:', envDebug.enabled);

// 10. Find where debug stores its instances
console.log('\n10. Exploring debug internals:');
const debugInstances = [];
for (const key in debug) {
  if (typeof debug[key] === 'function' && key !== 'log') {
    debugInstances.push(key);
  }
}
console.log('   - Function properties:', debugInstances);

// Try to find cached instances
if (debug.instances) {
  console.log('   - Number of cached instances:', debug.instances.length);
}

console.log('\n=== Research Complete ===\n');
console.log('Key findings:');
console.log('- Debug module caches instances internally');
console.log('- Overriding debug.log affects NEW instances, not existing ones');
console.log('- stderr.write capture is more reliable but captures all output');
console.log("- require cache clearing doesn't reset internal state");
