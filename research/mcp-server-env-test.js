#!/usr/bin/env node

/**
 * Test MCP server environment variable propagation
 * This simulates how the MCP client spawns the server process
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== Testing MCP Server Environment Variable Propagation ===\n');

// Test 1: Spawn with environment variables
console.log('Test 1: Spawning MCP server with RATE_LIMIT=50, RATE_LIMIT_WINDOW=30000');
console.log('Also enabling debug: DEBUG=mcp:*\n');

const env = {
  ...process.env,
  RATE_LIMIT: '50',
  RATE_LIMIT_WINDOW: '30000',
  DEBUG: 'mcp:*',
};

const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
const child = spawn('node', [serverPath], {
  env: env,
  stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
});

// Capture stderr (where debug logs go)
child.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

// Send a simple request to see if server starts properly
setTimeout(() => {
  console.log('\nSending test JSON-RPC request...');

  // Send a list tools request
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  };

  child.stdin.write(JSON.stringify(request) + '\n');
}, 100);

// Handle stdout (JSON-RPC responses)
let buffer = '';
child.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('\nReceived response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Non-JSON output:', line);
      }
    }
  }
});

// Give it some time then kill
setTimeout(() => {
  console.log('\nKilling server process...');
  child.kill();
}, 1000);

child.on('exit', (code) => {
  console.log(`\nServer process exited with code ${code}`);

  // Test 2: Check if rate limiter constructor is being called with env vars
  console.log('\n=== Direct Import Test ===');
  console.log('Setting RATE_LIMIT=75, RATE_LIMIT_WINDOW=45000');
  process.env.RATE_LIMIT = '75';
  process.env.RATE_LIMIT_WINDOW = '45000';

  // Clear module cache and re-import
  delete require.cache[require.resolve('../dist/utils/rateLimit')];
  const { SlidingWindowRateLimiter } = require('../dist/utils/rateLimit');

  const limiter = new SlidingWindowRateLimiter();
  const info = limiter.getInfo();
  console.log('Rate limiter info:', info);
  console.log('Expected limit: 75, actual:', info.limit);
  console.log('Expected window: 45000, actual:', info.window);
});
