import { createTestEnvironment } from './helpers/setup';
import { callTool } from './helpers/tools';

describe('Rate Limiting Integration', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should enforce rate limits through protocol', async () => {
    const { client, cleanup } = await createTestEnvironment({
      rateLimit: 5,
      rateLimitWindow: 1000,
    });

    try {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        await callTool(client, 'get_current_time', {});
      }

      // 6th request should fail
      await expect(callTool(client, 'get_current_time', {})).rejects.toMatchObject({
        code: -32000,
        message: 'Rate limit exceeded',
      });
    } finally {
      await cleanup();
    }
  });

  it('should allow requests after rate limit window', async () => {
    jest.useFakeTimers();
    const { client, cleanup } = await createTestEnvironment({
      rateLimit: 2,
      rateLimitWindow: 1000,
    });

    try {
      // Use up limit
      await callTool(client, 'get_current_time', {});
      await callTool(client, 'get_current_time', {});

      // Should be blocked
      await expect(callTool(client, 'get_current_time', {})).rejects.toMatchObject({
        code: -32000,
      });

      // Advance time
      jest.advanceTimersByTime(1100);

      // Should work again
      await expect(callTool(client, 'get_current_time', {})).resolves.toHaveProperty('timezone');
    } finally {
      await cleanup();
      jest.useRealTimers();
    }
  });

  it('should provide retry-after information', async () => {
    const { client, cleanup } = await createTestEnvironment({
      rateLimit: 1,
      rateLimitWindow: 5000,
    });

    try {
      // Use up the limit
      await callTool(client, 'get_current_time', {});

      // Next request should fail with retry-after info
      try {
        await callTool(client, 'get_current_time', {});
        fail('Should have thrown rate limit error');
      } catch (error: any) {
        expect(error.code).toBe(-32000);
        expect(error.message).toBe('Rate limit exceeded');
        expect(error.data).toMatchObject({
          limit: 1,
          window: 5000,
          retryAfter: expect.any(Number),
        });
        expect(error.data.retryAfter).toBeGreaterThan(0);
        expect(error.data.retryAfter).toBeLessThanOrEqual(5000);
      }
    } finally {
      await cleanup();
    }
  });

  it('should apply rate limiting per-client', async () => {
    // Create two separate clients
    const { client: client1, cleanup: cleanup1 } = await createTestEnvironment({
      rateLimit: 2,
      rateLimitWindow: 1000,
    });

    const { client: client2, cleanup: cleanup2 } = await createTestEnvironment({
      rateLimit: 2,
      rateLimitWindow: 1000,
    });

    try {
      // Client 1 uses up its limit
      await callTool(client1, 'get_current_time', {});
      await callTool(client1, 'get_current_time', {});

      // Client 1 should be blocked
      await expect(callTool(client1, 'get_current_time', {})).rejects.toMatchObject({
        code: -32000,
      });

      // Client 2 should still work
      await expect(callTool(client2, 'get_current_time', {})).resolves.toHaveProperty('timezone');
      await expect(callTool(client2, 'get_current_time', {})).resolves.toHaveProperty('timezone');

      // Now client 2 should be blocked
      await expect(callTool(client2, 'get_current_time', {})).rejects.toMatchObject({
        code: -32000,
      });
    } finally {
      await cleanup1();
      await cleanup2();
    }
  });

  it('should count different tools towards same rate limit', async () => {
    const { client, cleanup } = await createTestEnvironment({
      rateLimit: 3,
      rateLimitWindow: 1000,
    });

    try {
      // Use different tools
      await callTool(client, 'get_current_time', {});
      await callTool(client, 'add_time', { time: '2024-01-01', amount: 1, unit: 'days' });
      await callTool(client, 'format_time', { time: '2024-01-01', format: 'relative' });

      // Should be at limit now, any tool should fail
      await expect(
        callTool(client, 'calculate_duration', {
          start_time: '2024-01-01',
          end_time: '2024-01-02',
        }),
      ).rejects.toMatchObject({
        code: -32000,
        message: 'Rate limit exceeded',
      });
    } finally {
      await cleanup();
    }
  });
});
