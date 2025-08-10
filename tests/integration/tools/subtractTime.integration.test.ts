import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('subtract_time integration', () => {
  it('should execute subtract_time with basic parameters', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const baseTime = '2024-01-15T15:00:00.000Z';
      const result = await callTool(client, 'subtract_time', {
        time: baseTime,
        amount: 3,
        unit: 'hours',
      });

      expect(result.original).toBe(baseTime);
      expect(result.result).toBe('2024-01-15T12:00:00.000Z');
      expect(result.unix_original).toBe(new Date(baseTime).getTime() / 1000);
      expect(result.unix_result).toBe(new Date('2024-01-15T12:00:00.000Z').getTime() / 1000);
    } finally {
      await cleanup();
    }
  });

  it('should execute subtract_time with timezone', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'subtract_time', {
        time: '2024-01-15T10:00:00-05:00',
        amount: 2,
        unit: 'days',
        timezone: 'America/New_York',
      });

      expect(result.original).toBe('2024-01-15T10:00:00.000-05:00');
      expect(result.result).toBe('2024-01-13T10:00:00.000-05:00');
    } finally {
      await cleanup();
    }
  });

  it('should handle subtract_time validation errors', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      await expect(
        callTool(client, 'subtract_time', {
          time: '2024-01-15T10:00:00Z',
          amount: 1,
          unit: 'invalid-unit',
        }),
      ).rejects.toMatchObject({
        code: -32602,
        message: expect.stringContaining('Invalid unit'),
      });
    } finally {
      await cleanup();
    }
  });
});
