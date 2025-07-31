#!/usr/bin/env node

/**
 * Test MCP server rate limiting with environment variables
 */

const { spawn } = require('child_process');
const path = require('path');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testRateLimit() {
  console.log('=== Testing MCP Server Rate Limiting ===\n');

  // Test with custom rate limit: 5 requests per 10 seconds
  console.log('Starting server with RATE_LIMIT=5, RATE_LIMIT_WINDOW=10000');
  console.log('DEBUG=mcp:rate-limit to see rate limiter debug output\n');

  const env = {
    ...process.env,
    RATE_LIMIT: '5',
    RATE_LIMIT_WINDOW: '10000',
    DEBUG: 'mcp:*', // Enable all debug output
  };

  const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
  const child = spawn('node', [serverPath], {
    env: env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Capture stderr (debug output and server messages)
  child.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString().trim());
  });

  // Handle errors
  child.on('error', (error) => {
    console.error('Failed to start server:', error);
  });

  // Handle stdout (JSON-RPC responses)
  let buffer = '';
  const responses = [];

  child.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          responses.push(response);
        } catch (e) {
          console.log('Non-JSON output:', line);
        }
      }
    }
  });

  // Wait for server to start
  await sleep(200);

  // Send 7 requests rapidly (should hit rate limit after 5)
  console.log('\nSending 7 requests rapidly...\n');

  for (let i = 1; i <= 7; i++) {
    const request = {
      jsonrpc: '2.0',
      id: i,
      method: 'tools/call',
      params: {
        name: 'get_current_time',
        arguments: {},
      },
    };

    console.log(`Sending request ${i}...`);
    child.stdin.write(JSON.stringify(request) + '\n');
    await sleep(50); // Small delay to ensure ordering
  }

  // Wait for all responses
  await sleep(500);

  // Analyze responses
  console.log('\n=== Response Analysis ===\n');

  let successCount = 0;
  let rateLimitCount = 0;

  for (const response of responses) {
    if (response.error && response.error.message === 'Rate limit exceeded') {
      rateLimitCount++;
      console.log(
        `Request ${response.id}: RATE LIMITED - retry after ${response.error.data.retryAfter}s`,
      );
    } else if (response.result) {
      successCount++;
      console.log(`Request ${response.id}: SUCCESS`);
    }
  }

  console.log(`\nTotal: ${responses.length} responses`);
  console.log(`Success: ${successCount}`);
  console.log(`Rate limited: ${rateLimitCount}`);
  console.log(`\nExpected: 5 success, 2 rate limited`);

  // Clean up
  child.kill();

  return successCount === 5 && rateLimitCount === 2;
}

// Run the test
testRateLimit()
  .then((success) => {
    if (success) {
      console.log('\n✅ Rate limiting is working correctly!');
    } else {
      console.log('\n❌ Rate limiting test failed!');
    }
  })
  .catch((error) => {
    console.error('Test error:', error);
  });
