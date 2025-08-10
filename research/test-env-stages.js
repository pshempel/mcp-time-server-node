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
