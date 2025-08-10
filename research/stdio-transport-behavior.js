#!/usr/bin/env node
/**
 * Research: How does stdio transport behave in MCP?
 *
 * Questions to answer:
 * 1. Can multiple clients connect to same stdio process?
 * 2. What happens when client disconnects?
 * 3. How does process lifecycle work?
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('=== MCP stdio Transport Behavior Research ===\n');

async function testSingleConnection() {
  console.log('Test 1: Single client connection lifecycle');
  console.log('-'.repeat(40));

  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let serverAlive = true;

  server.on('exit', (code) => {
    console.log(`Server exited with code: ${code}`);
    serverAlive = false;
  });

  // Send initialization
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

  // Wait for response
  const response = await new Promise((resolve) => {
    server.stdout.once('data', (data) => resolve(data.toString()));
  });

  console.log('Init response received:', response.trim());

  // Now disconnect by closing stdin
  console.log('\nClosing client connection (stdin)...');
  server.stdin.end();

  // Wait a bit to see what happens
  await setTimeout(2000);

  console.log(`Server still alive after stdin close? ${serverAlive}`);

  if (serverAlive) {
    server.kill();
  }

  console.log('\n');
}

async function testMultipleConnectionAttempts() {
  console.log('Test 2: Multiple connection attempts to same process');
  console.log('-'.repeat(40));

  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // First connection
  const init1 =
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'client-1', version: '1.0.0' },
      },
    }) + '\n';

  server.stdin.write(init1);

  const response1 = await new Promise((resolve) => {
    server.stdout.once('data', (data) => resolve(data.toString()));
  });

  console.log('Client 1 init response:', response1.trim());

  // Try second initialization (should this work?)
  const init2 =
    JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'client-2', version: '1.0.0' },
      },
    }) + '\n';

  console.log('\nAttempting second initialization...');
  server.stdin.write(init2);

  try {
    const response2 = await Promise.race([
      new Promise((resolve) => {
        server.stdout.once('data', (data) => resolve(data.toString()));
      }),
      setTimeout(1000).then(() => 'TIMEOUT'),
    ]);

    console.log('Client 2 init response:', response2);
  } catch (e) {
    console.log('Client 2 init failed:', e.message);
  }

  server.kill();
  console.log('\n');
}

async function testProcessPerConnection() {
  console.log('Test 3: Each connection gets new process');
  console.log('-'.repeat(40));

  const processes = [];

  // Start 3 separate processes
  for (let i = 0; i < 3; i++) {
    const server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    processes.push({
      id: i + 1,
      process: server,
      pid: server.pid,
    });

    console.log(`Started server ${i + 1} with PID: ${server.pid}`);
  }

  console.log(
    '\nAll processes have different PIDs:',
    processes.every((p, i, arr) => arr.every((other, j) => i === j || p.pid !== other.pid)),
  );

  // Clean up
  processes.forEach((p) => p.process.kill());
  console.log('\n');
}

async function testRateLimitingPerProcess() {
  console.log('Test 4: Rate limiting is per-process');
  console.log('-'.repeat(40));

  // Set up environment for low rate limit
  const env = { ...process.env, RATE_LIMIT: '2', RATE_LIMIT_WINDOW: '60000' };

  // Start two separate processes
  const server1 = spawn('node', ['dist/index.js'], { stdio: ['pipe', 'pipe', 'pipe'], env });
  const server2 = spawn('node', ['dist/index.js'], { stdio: ['pipe', 'pipe', 'pipe'], env });

  console.log(`Server 1 PID: ${server1.pid}`);
  console.log(`Server 2 PID: ${server2.pid}`);

  // Initialize both
  for (const [index, server] of [server1, server2].entries()) {
    const init =
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: `client-${index + 1}`, version: '1.0.0' },
        },
      }) + '\n';

    server.stdin.write(init);
    await new Promise((resolve) => server.stdout.once('data', resolve));
  }

  // Make 3 requests to each (limit is 2)
  let server1Success = 0,
    server1Limited = 0;
  let server2Success = 0,
    server2Limited = 0;

  for (let i = 0; i < 3; i++) {
    // Server 1
    const req1 =
      JSON.stringify({
        jsonrpc: '2.0',
        id: i + 2,
        method: 'tools/call',
        params: { name: 'get_current_time', arguments: {} },
      }) + '\n';

    server1.stdin.write(req1);
    const resp1 = await new Promise((resolve) => server1.stdout.once('data', resolve));
    const parsed1 = JSON.parse(resp1.toString());

    if (parsed1.error?.code === -32000) {
      server1Limited++;
    } else if (parsed1.result) {
      server1Success++;
    }

    // Server 2
    const req2 =
      JSON.stringify({
        jsonrpc: '2.0',
        id: i + 2,
        method: 'tools/call',
        params: { name: 'get_current_time', arguments: {} },
      }) + '\n';

    server2.stdin.write(req2);
    const resp2 = await new Promise((resolve) => server2.stdout.once('data', resolve));
    const parsed2 = JSON.parse(resp2.toString());

    if (parsed2.error?.code === -32000) {
      server2Limited++;
    } else if (parsed2.result) {
      server2Success++;
    }
  }

  console.log(`\nServer 1: ${server1Success} success, ${server1Limited} rate limited`);
  console.log(`Server 2: ${server2Success} success, ${server2Limited} rate limited`);
  console.log(
    `\nEach server has independent rate limit: ${server1Success === 2 && server2Success === 2}`,
  );

  server1.kill();
  server2.kill();
}

// Run all tests
async function main() {
  try {
    await testSingleConnection();
    await testMultipleConnectionAttempts();
    await testProcessPerConnection();
    await testRateLimitingPerProcess();

    console.log('=== Research Complete ===');
  } catch (error) {
    console.error('Research error:', error);
  }
}

main();
