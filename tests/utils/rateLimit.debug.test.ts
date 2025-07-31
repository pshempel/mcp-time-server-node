import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Rate limiter debug output', () => {
  const originalEnv = process.env;
  const originalStderr = process.stderr.write;
  let stderrOutput: string[] = [];

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    stderrOutput = [];

    // Mock stderr to capture debug output
    process.stderr.write = jest.fn((chunk: string | Uint8Array) => {
      stderrOutput.push(chunk.toString());
      return true;
    }) as any;

    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    process.stderr.write = originalStderr;
  });

  it('should log rate limiter creation when debug is enabled', async () => {
    process.env.DEBUG = 'mcp:rate-limit';
    process.env.RATE_LIMIT = '5';
    process.env.RATE_LIMIT_WINDOW = '10000';

    // Import AFTER setting environment variables
    const { SlidingWindowRateLimiter } = await import('../../src/utils/rateLimit');

    new SlidingWindowRateLimiter(); // Constructor should log

    const output = stderrOutput.join('');
    expect(output).toContain('mcp:rate-limit');
    expect(output).toContain('Creating rate limiter');
    expect(output).toContain('limit: 5');
    expect(output).toContain('window: 10000ms');
  });

  it('should log when requests are allowed', async () => {
    process.env.DEBUG = 'mcp:rate-limit';

    const { SlidingWindowRateLimiter } = await import('../../src/utils/rateLimit');
    const limiter = new SlidingWindowRateLimiter(2, 1000);
    limiter.checkLimit();

    const output = stderrOutput.join('');
    expect(output).toContain('Request allowed');
    expect(output).toContain('usage: 1/2');
  });

  it('should log when rate limit is exceeded', async () => {
    process.env.DEBUG = 'mcp:rate-limit';

    const { SlidingWindowRateLimiter } = await import('../../src/utils/rateLimit');
    const limiter = new SlidingWindowRateLimiter(2, 60000);
    limiter.checkLimit();
    limiter.checkLimit();
    limiter.checkLimit(); // This should be blocked

    const output = stderrOutput.join('');
    expect(output).toContain('Rate limit exceeded');
    expect(output).toContain('usage: 2/2');
    expect(output).toContain('retry after:');
  });

  it('should not log when debug is disabled', async () => {
    delete process.env.DEBUG;

    const { SlidingWindowRateLimiter } = await import('../../src/utils/rateLimit');
    const limiter = new SlidingWindowRateLimiter(2, 1000);
    limiter.checkLimit();

    expect(stderrOutput).toHaveLength(0);
  });

  it('should log cleanup operations', async () => {
    process.env.DEBUG = 'mcp:rate-limit';

    const { SlidingWindowRateLimiter } = await import('../../src/utils/rateLimit');
    const limiter = new SlidingWindowRateLimiter(2, 100); // 100ms window
    limiter.checkLimit();

    // Wait for window to expire
    jest.useFakeTimers();
    jest.advanceTimersByTime(150);

    limiter.checkLimit(); // This should trigger cleanup

    jest.useRealTimers();

    const output = stderrOutput.join('');
    expect(output).toContain('Cleaned up');
    expect(output).toContain('old requests');
  });
});
