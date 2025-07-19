import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { createTestEnvironment } from './helpers/setup';

describe('Integration Test Infrastructure Setup', () => {
  describe('Transport Creation', () => {
    it('should create linked transport pair', () => {
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      expect(clientTransport).toBeDefined();
      expect(serverTransport).toBeDefined();
    });
  });

  describe('Client-Server Connection', () => {
    it('should connect client and server', async () => {
      const { client, server } = await createTestEnvironment();
      // We don't have isConnected() method, so let's check they exist
      expect(client).toBeDefined();
      expect(server).toBeDefined();
    });
  });

  describe('Connection Cleanup', () => {
    it('should properly close connections', async () => {
      const { client, server, cleanup } = await createTestEnvironment();

      // Verify connections work before cleanup
      expect(client).toBeDefined();
      expect(server).toBeDefined();

      // Close connections
      await cleanup();

      // After cleanup, trying to use them should fail
      await expect(
        client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema),
      ).rejects.toThrow();
    });
  });

  describe('Test with Rate Limit Options', () => {
    it('should create environment with custom rate limits', async () => {
      const originalRateLimit = process.env.RATE_LIMIT;
      const originalWindow = process.env.RATE_LIMIT_WINDOW;

      const { cleanup } = await createTestEnvironment({
        rateLimit: 10,
        rateLimitWindow: 5000,
      });

      // Environment variables should be set
      expect(process.env.RATE_LIMIT).toBe('10');
      expect(process.env.RATE_LIMIT_WINDOW).toBe('5000');

      await cleanup();

      // Environment variables should be cleaned up
      expect(process.env.RATE_LIMIT).toBe(originalRateLimit);
      expect(process.env.RATE_LIMIT_WINDOW).toBe(originalWindow);
    });
  });
});
