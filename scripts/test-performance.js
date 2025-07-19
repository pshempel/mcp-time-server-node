#!/usr/bin/env node

const { spawn } = require('child_process');

// Test performance by measuring response times
async function measurePerformance() {
  console.log('=== Performance Testing ===\n');

  const tests = [
    {
      name: 'get_current_time (cached)',
      request: {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
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
        id: 2,
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
        id: 3,
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

  for (const test of tests) {
    console.log(`Testing ${test.name}...`);

    // Warm up request
    await sendRequest(test.request);

    // Measure 10 requests
    const times = [];
    for (let i = 0; i < 10; i++) {
      const start = process.hrtime.bigint();
      await sendRequest(test.request);
      const end = process.hrtime.bigint();
      const timeMs = Number(end - start) / 1000000; // Convert to milliseconds
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
}

function sendRequest(request) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/index.js']);
    let response = '';

    child.stdout.on('data', (data) => {
      response += data.toString();
    });

    child.on('close', () => {
      resolve(response);
    });

    child.on('error', reject);

    child.stdin.write(JSON.stringify(request));
    child.stdin.end();
  });
}

measurePerformance().catch(console.error);
