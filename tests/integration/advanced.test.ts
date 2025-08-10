import { createTestEnvironment, createTestEnvironmentWithInterceptor } from './helpers/setup';
import { callTool } from './helpers/tools';

describe('Advanced Integration Tests', () => {
  describe('Concurrent Requests', () => {
    it('should handle concurrent requests', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const promises = [
          callTool(client, 'get_current_time', { timezone: 'UTC' }),
          callTool(client, 'add_time', { time: '2025-01-01', amount: 1, unit: 'days' }),
          callTool(client, 'format_time', { time: '2025-01-01', format: 'relative' }),
        ];

        const results = await Promise.all(promises);

        expect(results[0]).toHaveProperty('timezone', 'UTC');
        expect(results[1]).toHaveProperty('result');
        expect(results[2]).toHaveProperty('formatted');
      } finally {
        await cleanup();
      }
    });

    it('should handle many concurrent requests', async () => {
      const { client, cleanup } = await createTestEnvironment({
        rateLimit: 100, // High limit for this test
        rateLimitWindow: 1000,
      });

      try {
        // Create 20 concurrent requests
        const promises = Array.from({ length: 20 }, (_, i) =>
          callTool(client, 'get_current_time', {
            timezone: i % 2 === 0 ? 'UTC' : 'America/New_York',
          }),
        );

        const results = await Promise.all(promises);

        // All should succeed
        expect(results).toHaveLength(20);
        results.forEach((result, i) => {
          expect(result).toHaveProperty('timezone');
          expect(result.timezone).toBe(i % 2 === 0 ? 'UTC' : 'America/New_York');
        });
      } finally {
        await cleanup();
      }
    });

    it('should handle concurrent requests with different tools', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        // Mix of different tools running concurrently
        const promises = [
          callTool(client, 'get_current_time', {}),
          callTool(client, 'convert_timezone', {
            time: '2025-01-01T12:00:00Z',
            from_timezone: 'UTC',
            to_timezone: 'America/New_York',
          }),
          callTool(client, 'add_time', {
            time: '2025-01-01',
            amount: 1,
            unit: 'days',
          }),
          callTool(client, 'calculate_duration', {
            start_time: '2025-01-01',
            end_time: '2025-01-02',
          }),
          callTool(client, 'get_business_days', {
            start_date: '2025-01-01',
            end_date: '2025-01-31',
          }),
        ];

        const results = await Promise.all(promises);

        // Verify each tool returned expected results
        expect(results[0]).toHaveProperty('timezone');
        expect(results[1]).toHaveProperty('converted');
        expect(results[2]).toHaveProperty('result');
        expect(results[3]).toHaveProperty('hours', 24);
        expect(results[4]).toHaveProperty('business_days');
      } finally {
        await cleanup();
      }
    });

    it('should handle concurrent requests with errors', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const promises = [
          callTool(client, 'get_current_time', {}), // Should succeed
          callTool(client, 'add_time', { time: 'invalid', amount: 1, unit: 'days' }).catch(
            (e) => e,
          ), // Should fail
          callTool(client, 'format_time', { time: '2025-01-01', format: 'relative' }), // Should succeed
        ];

        const results = await Promise.all(promises);

        // First should succeed
        expect(results[0]).toHaveProperty('timezone');

        // Second should be an error
        expect(results[1]).toBeInstanceOf(Error);
        expect(results[1]).toHaveProperty('code', -32602);

        // Third should succeed
        expect(results[2]).toHaveProperty('formatted');
      } finally {
        await cleanup();
      }
    });
  });

  describe('Message Ordering', () => {
    it('should maintain message order', async () => {
      const { client, clientInterceptor, cleanup } = await createTestEnvironmentWithInterceptor();

      try {
        await callTool(client, 'get_current_time', {});
        await callTool(client, 'add_time', { time: '2025-01-01', amount: 1, unit: 'days' });

        const requests = clientInterceptor
          .getSentMessages()
          .filter((m: any) => m.method === 'tools/call');

        expect(requests[0].params.name).toBe('get_current_time');
        expect(requests[1].params.name).toBe('add_time');
      } finally {
        await cleanup();
      }
    });

    it('should assign unique message IDs', async () => {
      const { client, clientInterceptor, cleanup } = await createTestEnvironmentWithInterceptor();

      try {
        // Make several requests
        await callTool(client, 'get_current_time', {});
        await callTool(client, 'add_time', { time: '2025-01-01', amount: 1, unit: 'days' });
        await callTool(client, 'format_time', { time: '2025-01-01', format: 'relative' });

        const messages = clientInterceptor.getSentMessages();

        // Filter for tools/call messages (these should have IDs)
        const toolCallMessages = messages.filter((m: any) => m.method === 'tools/call');
        expect(toolCallMessages.length).toBeGreaterThanOrEqual(3);

        const messageIds = toolCallMessages.map((m: any) => m.id);

        // All IDs should be unique
        const uniqueIds = new Set(messageIds);
        expect(uniqueIds.size).toBe(messageIds.length);

        // IDs should be defined
        messageIds.forEach((id: any) => {
          expect(id).toBeDefined();
          expect(['string', 'number']).toContain(typeof id);
        });
      } finally {
        await cleanup();
      }
    });

    it('should match request and response IDs', async () => {
      const { client, clientInterceptor, serverInterceptor, cleanup } =
        await createTestEnvironmentWithInterceptor();

      try {
        await callTool(client, 'get_current_time', { timezone: 'UTC' });

        const sentMessages = clientInterceptor.getSentMessages();
        const receivedMessages = serverInterceptor.getReceivedMessages();

        // Should have one request and one response
        const request = sentMessages.find((m: any) => m.method === 'tools/call');
        const response = receivedMessages.find((m: any) => m.id === request?.id);

        expect(request).toBeDefined();
        expect(response).toBeDefined();
        expect(response?.id).toBe(request?.id);
      } finally {
        await cleanup();
      }
    });

    it('should handle interleaved concurrent requests correctly', async () => {
      const { client, clientInterceptor, cleanup } = await createTestEnvironmentWithInterceptor();

      try {
        // Start multiple requests concurrently
        const promise1 = callTool(client, 'get_current_time', { timezone: 'UTC' });
        const promise2 = callTool(client, 'get_current_time', { timezone: 'America/New_York' });
        const promise3 = callTool(client, 'get_current_time', { timezone: 'Asia/Tokyo' });

        // Wait for all to complete
        const results = await Promise.all([promise1, promise2, promise3]);

        // Verify all completed successfully
        expect(results[0].timezone).toBe('UTC');
        expect(results[1].timezone).toBe('America/New_York');
        expect(results[2].timezone).toBe('Asia/Tokyo');

        // Check that all messages have unique IDs
        const messages = clientInterceptor.getSentMessages();
        const ids = messages.map((m: any) => m.id);
        expect(new Set(ids).size).toBe(ids.length);
      } finally {
        await cleanup();
      }
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle rapid sequential requests', async () => {
      const { client, cleanup } = await createTestEnvironment({
        rateLimit: 50,
        rateLimitWindow: 1000,
      });

      try {
        const startTime = Date.now();
        const results = [];

        // Make 10 rapid requests
        for (let i = 0; i < 10; i++) {
          const result = await callTool(client, 'get_current_time', {});
          results.push(result);
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // All should succeed
        expect(results).toHaveLength(10);
        results.forEach((result) => {
          expect(result).toHaveProperty('timezone');
        });

        // Should complete reasonably quickly (under 1 second for 10 requests)
        expect(totalTime).toBeLessThan(1000);
      } finally {
        await cleanup();
      }
    });

    it('should handle mixed concurrent and sequential requests', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        // Sequential phase
        const seq1 = await callTool(client, 'get_current_time', {});
        const seq2 = await callTool(client, 'add_time', {
          time: '2025-01-01',
          amount: 1,
          unit: 'days',
        });

        // Concurrent phase
        const concurrentResults = await Promise.all([
          callTool(client, 'format_time', { time: '2025-01-01', format: 'relative' }),
          callTool(client, 'calculate_duration', {
            start_time: '2025-01-01',
            end_time: '2025-01-02',
          }),
        ]);

        // Another sequential phase
        const seq3 = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
        });

        // Verify all results
        expect(seq1).toHaveProperty('timezone');
        expect(seq2).toHaveProperty('result');
        expect(concurrentResults[0]).toHaveProperty('formatted');
        expect(concurrentResults[1]).toHaveProperty('hours');
        expect(seq3).toHaveProperty('business_days');
      } finally {
        await cleanup();
      }
    });
  });
});
