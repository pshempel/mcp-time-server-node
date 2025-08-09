import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Debug utilities', () => {
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
  });

  afterEach(() => {
    process.env = originalEnv;
    process.stderr.write = originalStderr;
    jest.resetModules();
  });

  describe('debug namespaces', () => {
    it('should create namespaced debug functions', async () => {
      const { debug } = await import('../../src/utils/debug');

      expect(debug.server).toBeDefined();
      expect(debug.rateLimit).toBeDefined();
      // tools namespace removed - verify it's undefined
      expect((debug as any).tools).toBeUndefined();
      expect(debug.protocol).toBeDefined();
      expect(debug.cache).toBeDefined();
      expect(debug.init).toBeDefined();
    });

    it('should output to stderr when DEBUG env is set', async () => {
      process.env.DEBUG = 'mcp:server';

      const { debug } = await import('../../src/utils/debug');
      debug.server('test message');

      const output = stderrOutput.join('');
      expect(output).toContain('mcp:server');
      expect(output).toContain('test message');
    });

    it('should not output when DEBUG env is not set', async () => {
      delete process.env.DEBUG;

      const { debug } = await import('../../src/utils/debug');
      debug.server('test message');

      expect(stderrOutput).toHaveLength(0);
    });

    it('should support multiple namespaces', async () => {
      process.env.DEBUG = 'mcp:server,mcp:rate-limit';

      const { debug } = await import('../../src/utils/debug');
      debug.server('server message');
      debug.rateLimit('rate limit message');
      debug.cache('cache message'); // Should not output

      const output = stderrOutput.join('');
      expect(output).toContain('server message');
      expect(output).toContain('rate limit message');
      expect(output).not.toContain('cache message');
    });

    it('should support wildcard namespace', async () => {
      process.env.DEBUG = 'mcp:*';

      const { debug } = await import('../../src/utils/debug');
      debug.server('server message');
      debug.rateLimit('rate limit message');
      debug.timing('timing message');

      const output = stderrOutput.join('');
      expect(output).toContain('server message');
      expect(output).toContain('rate limit message');
      expect(output).toContain('timing message');
    });
  });

  describe('logEnvironment', () => {
    it('should log environment variables when debug is enabled', async () => {
      process.env.DEBUG = 'mcp:init';
      process.env.RATE_LIMIT = '50';
      process.env.RATE_LIMIT_WINDOW = '30000';

      const { logEnvironment } = await import('../../src/utils/debug');
      logEnvironment();

      const output = stderrOutput.join('');
      expect(output).toContain('=== MCP Server Environment ===');
      expect(output).toContain('RATE_LIMIT: 50');
      expect(output).toContain('RATE_LIMIT_WINDOW: 30000');
      expect(output).toContain('DEBUG: mcp:init');
    });

    it('should show defaults when environment variables are not set', async () => {
      process.env.DEBUG = 'mcp:init';
      delete process.env.RATE_LIMIT;
      delete process.env.RATE_LIMIT_WINDOW;

      const { logEnvironment } = await import('../../src/utils/debug');
      logEnvironment();

      const output = stderrOutput.join('');
      expect(output).toContain('RATE_LIMIT: 100 (default)');
      expect(output).toContain('RATE_LIMIT_WINDOW: 60000 (default)');
    });

    it('should not log when debug is disabled', async () => {
      delete process.env.DEBUG;

      const { logEnvironment } = await import('../../src/utils/debug');
      logEnvironment();

      expect(stderrOutput).toHaveLength(0);
    });
  });

  describe('debugJson', () => {
    it('should format objects for debug output', async () => {
      process.env.DEBUG = 'mcp:timing';

      const { debugJson } = await import('../../src/utils/debug');
      const testObj = { foo: 'bar', nested: { value: 42 } };

      debugJson('timing', 'Test object', testObj);

      const output = stderrOutput.join('');
      expect(output).toContain('Test object:');
      expect(output).toContain('foo');
      expect(output).toContain('bar');
      expect(output).toContain('nested');
      expect(output).toContain('42');
    });

    it('should not output when namespace is disabled', async () => {
      process.env.DEBUG = 'mcp:server';

      const { debugJson } = await import('../../src/utils/debug');
      debugJson('tools', 'Test object', { foo: 'bar' });

      expect(stderrOutput).toHaveLength(0);
    });
  });

  describe('rate limit debugging', () => {
    it('should be able to debug rate limit operations', async () => {
      process.env.DEBUG = 'mcp:rate-limit';

      const { debug } = await import('../../src/utils/debug');

      // Simulate rate limit debugging
      debug.rateLimit('Creating rate limiter with limit=%d, window=%dms', 100, 60000);
      debug.rateLimit('Request allowed. Current usage: %d/%d', 1, 100);
      debug.rateLimit('Rate limit exceeded. Retry after: %ds', 45);

      const output = stderrOutput.join('');
      expect(output).toContain('Creating rate limiter with limit=100, window=60000ms');
      expect(output).toContain('Request allowed. Current usage: 1/100');
      expect(output).toContain('Rate limit exceeded. Retry after: 45s');
    });
  });
});
