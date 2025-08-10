#!/usr/bin/env node
/**
 * Test environment variable timing in spawned process
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

// Create a test script that logs environment variables
const testScript = `
console.log('=== Environment at different stages ===');
console.log('1. Top level:', process.env.RATE_LIMIT);

import { SlidingWindowRateLimiter } from './dist/utils/rateLimit.js';

console.log('2. After import:', process.env.RATE_LIMIT);

const topLevelLimiter = new SlidingWindowRateLimiter();
console.log('3. Top level limiter:', topLevelLimiter.getInfo());

async function main() {
  console.log('4. In main():', process.env.RATE_LIMIT);
  const mainLimiter = new SlidingWindowRateLimiter();
  console.log('5. Main limiter:', mainLimiter.getInfo());
}

main();
`;

writeFileSync('research/test-env-stages.js', testScript);

// Now spawn it with environment variables
const env = {
  ...process.env,
  RATE_LIMIT: '2',
  RATE_LIMIT_WINDOW: '5000',
};

console.log('Spawning process with RATE_LIMIT=2...\n');

const proc = spawn('node', ['research/test-env-stages.js'], {
  env,
  stdio: 'inherit',
});

proc.on('exit', (code) => {
  console.log(`\nProcess exited with code ${code}`);
});
