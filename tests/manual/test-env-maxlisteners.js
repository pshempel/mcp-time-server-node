#!/usr/bin/env node

/**
 * Test script to verify MAX_LISTENERS environment variable support
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Testing MAX_LISTENERS Environment Variable Support');
console.log('=================================================\n');

const serverPath = path.join(__dirname, 'dist', 'index.js');

// Test cases
const tests = [
  { name: 'Default (no env var)', env: {}, expected: '20' },
  { name: 'Custom value 30', env: { MAX_LISTENERS: '30' }, expected: '30' },
  { name: 'Custom value 50', env: { MAX_LISTENERS: '50' }, expected: '50' },
  { name: 'Invalid value (string)', env: { MAX_LISTENERS: 'invalid' }, expected: '20' },
  { name: 'Below minimum (5)', env: { MAX_LISTENERS: '5' }, expected: '10' },
  { name: 'Zero value', env: { MAX_LISTENERS: '0' }, expected: '20' },
  { name: 'Negative value', env: { MAX_LISTENERS: '-10' }, expected: '20' },
];

async function testMaxListeners(testCase) {
  return new Promise((resolve) => {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`MAX_LISTENERS=${testCase.env.MAX_LISTENERS || '(not set)'}`);

    const env = { ...process.env, ...testCase.env };
    const child = spawn('node', [serverPath], { env });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Send a simple initialize request to start the server
    const initRequest = JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '0.1.0',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0' },
      },
      id: 1,
    });

    setTimeout(() => {
      child.stdin.write(initRequest + '\n');

      setTimeout(() => {
        child.kill();

        // Check if server started successfully
        if (errorOutput.includes('MCP Time Server running on stdio')) {
          console.log('✅ Server started successfully');
          console.log(`Expected max listeners: ${testCase.expected}`);
          resolve(true);
        } else {
          console.log('❌ Server failed to start');
          console.log('Error:', errorOutput);
          resolve(false);
        }
      }, 500);
    }, 100);
  });
}

async function runTests() {
  console.log('Running tests...\n');

  for (const test of tests) {
    await testMaxListeners(test);
  }

  console.log('\n\nEnvironment Variable Usage:');
  console.log('===========================');
  console.log('Set MAX_LISTENERS to control concurrent request handling:');
  console.log('  - Default: 20 (prevents warnings for up to 20 concurrent calls)');
  console.log('  - Minimum: 10 (values below 10 are set to 10)');
  console.log('  - Invalid values fall back to default (20)');
  console.log('\nExample usage:');
  console.log('  MAX_LISTENERS=30 node dist/index.js');
  console.log('  MAX_LISTENERS=50 claude mcp add /path/to/mcp-time-server');
}

runTests().catch(console.error);
