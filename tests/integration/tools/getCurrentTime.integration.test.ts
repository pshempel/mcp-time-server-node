import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('get_current_time integration', () => {
  it('should execute get_current_time with default params', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'get_current_time', {});

      // Should use system timezone when no timezone specified
      expect(result.timezone).toBeDefined();
      expect(result.timezone).not.toBe(''); // Should have a valid timezone
      expect(result.unix).toBeCloseTo(Date.now() / 1000, -1); // Allow 10 second difference
      expect(result.offset).toMatch(/^([+-]\d{2}:\d{2}|Z)$/); // Valid offset format
      expect(result.iso).toBeDefined();
      expect(result.time).toBeDefined();
    } finally {
      await cleanup();
    }
  });

  it('should execute get_current_time with specific timezone', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'get_current_time', {
        timezone: 'America/New_York',
      });

      expect(result.timezone).toBe('America/New_York');
      expect(result.offset).toMatch(/^[+-]\d{2}:\d{2}$/);
    } finally {
      await cleanup();
    }
  });

  it('should use UTC when empty string timezone provided', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'get_current_time', {
        timezone: '',
      });

      expect(result.timezone).toBe('UTC');
      expect(result.offset).toBe('Z');
    } finally {
      await cleanup();
    }
  });
});
