import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('add_time integration', () => {
  it('should execute add_time with basic parameters', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const baseTime = '2024-01-15T10:00:00.000Z';
      const result = await callTool(client, 'add_time', {
        time: baseTime,
        amount: 5,
        unit: 'hours',
      });

      expect(result.original).toBe(baseTime);
      expect(result.result).toBe('2024-01-15T15:00:00.000Z');
      expect(result.unix_original).toBe(new Date(baseTime).getTime() / 1000);
      expect(result.unix_result).toBe(new Date('2024-01-15T15:00:00.000Z').getTime() / 1000);
    } finally {
      await cleanup();
    }
  });

  it('should execute add_time with timezone', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'add_time', {
        time: '2024-01-15T10:00:00-05:00',
        amount: 1,
        unit: 'days',
        timezone: 'America/New_York',
      });

      expect(result.original).toBe('2024-01-15T10:00:00.000-05:00');
      expect(result.result).toBe('2024-01-16T10:00:00.000-05:00');
    } finally {
      await cleanup();
    }
  });

  it('should handle add_time validation errors', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      await expect(
        callTool(client, 'add_time', {
          time: 'invalid-date',
          amount: 1,
          unit: 'days',
        })
      ).rejects.toMatchObject({
        code: 'TOOL_ERROR',
        message: expect.stringContaining('Invalid time format'),
      });
    } finally {
      await cleanup();
    }
  });
});
