#!/usr/bin/env node

const { spawn } = require('child_process');

async function testRateLimiting() {
  console.log('=== Testing Rate Limiting with Persistent Server ===\n');

  // Start server with low rate limit
  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, RATE_LIMIT: '5', RATE_LIMIT_WINDOW: '10000' },
  });

  let buffer = '';
  const responses = [];

  server.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.trim() && !line.includes('MCP Time Server running')) {
        try {
          const response = JSON.parse(line);
          responses.push(response);
        } catch (e) {
          // Ignore
        }
      }
    }
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log('Sending 10 rapid requests with RATE_LIMIT=5 (window=10s)...\n');

  // Send 10 rapid requests
  for (let i = 1; i <= 10; i++) {
    const request = {
      jsonrpc: '2.0',
      method: 'tools/call',
      id: i,
      params: {
        name: 'get_current_time',
        arguments: { timezone: 'UTC' },
      },
    };
    server.stdin.write(JSON.stringify(request) + '\n');
  }

  // Wait for responses
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Analyze results
  let successCount = 0;
  let rateLimitCount = 0;

  responses.forEach((resp, index) => {
    if (resp.result && resp.result.content) {
      successCount++;
      console.log(`Request ${index + 1}: ✅ Success`);
    } else if (
      resp.result &&
      resp.result.error &&
      resp.result.error.code === 'RATE_LIMIT_EXCEEDED'
    ) {
      rateLimitCount++;
      console.log(`Request ${index + 1}: ⛔ Rate limited`);
    }
  });

  console.log(`\nResults: ${successCount} successful, ${rateLimitCount} rate limited`);
  console.log(`Rate limiting ${rateLimitCount > 0 ? '✅ WORKING' : '❌ NOT ENFORCED'}`);

  server.kill();
}

testRateLimiting().catch(console.error);
