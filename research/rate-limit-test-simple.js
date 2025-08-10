#!/usr/bin/env node
/**
 * Simple rate limit test to verify environment variables are working
 */

import { spawn } from 'child_process';

console.log('=== Simple Rate Limit Test ===\n');

async function testRateLimit() {
  // Set very low rate limit
  const env = {
    ...process.env,
    RATE_LIMIT: '2',
    RATE_LIMIT_WINDOW: '60000',
    NODE_ENV: 'development',
  };

  console.log('Starting server with RATE_LIMIT=2, RATE_LIMIT_WINDOW=60000');

  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });

  // Capture stderr for debugging
  server.stderr.on('data', (data) => {
    console.error('Server stderr:', data.toString());
  });

  try {
    // Initialize
    const initRequest =
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      }) + '\n';

    server.stdin.write(initRequest);

    const initResponse = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Init timeout')), 5000);
      server.stdout.once('data', (data) => {
        clearTimeout(timeout);
        resolve(data.toString());
      });
    });

    console.log('Init response:', JSON.parse(initResponse));

    // Make 4 requests (should hit limit at 3rd)
    console.log('\nMaking 4 requests with rate limit of 2...');

    for (let i = 0; i < 4; i++) {
      const toolRequest =
        JSON.stringify({
          jsonrpc: '2.0',
          id: i + 2,
          method: 'tools/call',
          params: {
            name: 'get_current_time',
            arguments: {},
          },
        }) + '\n';

      server.stdin.write(toolRequest);

      const toolResponse = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Request ${i + 1} timeout`)), 5000);
        server.stdout.once('data', (data) => {
          clearTimeout(timeout);
          resolve(data.toString());
        });
      });

      const parsed = JSON.parse(toolResponse);

      if (parsed.error) {
        console.log(
          `Request ${i + 1}: RATE LIMITED (code: ${parsed.error.code}, message: ${parsed.error.message})`,
        );
        if (parsed.error.data) {
          console.log(`  Rate limit info:`, parsed.error.data);
        }
      } else if (parsed.result) {
        console.log(`Request ${i + 1}: SUCCESS`);
      }
    }
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    server.kill();
  }
}

testRateLimit().catch(console.error);
