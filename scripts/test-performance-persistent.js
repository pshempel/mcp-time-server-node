#!/usr/bin/env node

const net = require('net');
const { spawn } = require('child_process');

// Test performance with persistent server connection
async function testPersistentPerformance() {
  console.log('=== Performance Testing with Persistent Server ===\n');

  // Start the server
  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let buffer = '';
  const responses = new Map();
  let currentId = 1;

  server.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim() && !line.includes('MCP Time Server running')) {
        try {
          const response = JSON.parse(line);
          const resolver = responses.get(response.id);
          if (resolver) {
            resolver(response);
            responses.delete(response.id);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 100));

  const tests = [
    {
      name: 'get_current_time (first call)',
      request: {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'get_current_time',
          arguments: { timezone: 'UTC' },
        },
      },
    },
    {
      name: 'get_current_time (cached)',
      request: {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'get_current_time',
          arguments: { timezone: 'UTC' },
        },
      },
    },
    {
      name: 'convert_timezone',
      request: {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'convert_timezone',
          arguments: {
            time: '2025-01-20T15:00:00Z',
            from_timezone: 'UTC',
            to_timezone: 'America/New_York',
          },
        },
      },
    },
    {
      name: 'calculate_duration',
      request: {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'calculate_duration',
          arguments: {
            start_time: '2025-01-20T09:00:00',
            end_time: '2025-01-20T17:30:00',
          },
        },
      },
    },
  ];

  // Function to send request and measure time
  async function measureRequest(request) {
    const id = currentId++;
    request.id = id;

    return new Promise((resolve) => {
      responses.set(id, resolve);
      const start = process.hrtime.bigint();

      server.stdin.write(JSON.stringify(request) + '\n');

      responses.set(id, (response) => {
        const end = process.hrtime.bigint();
        const timeMs = Number(end - start) / 1000000;
        resolve({ response, timeMs });
      });
    });
  }

  for (const test of tests) {
    console.log(`Testing ${test.name}...`);

    // Warm up
    await measureRequest(test.request);

    // Measure 10 requests
    const times = [];
    for (let i = 0; i < 10; i++) {
      const { timeMs } = await measureRequest(test.request);
      times.push(timeMs);
    }

    // Calculate statistics
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    console.log(`  All < 10ms: ${max < 10 ? '✅ YES' : '❌ NO'}`);
    console.log();
  }

  // Clean up
  server.kill();
}

testPersistentPerformance().catch(console.error);
