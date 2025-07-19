import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('next_occurrence integration', () => {
  it('should execute next_occurrence for daily pattern', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'next_occurrence', {
        pattern: 'daily',
        time: '14:00',
        timezone: 'UTC',
      });

      expect(result.next).toBeDefined();
      expect(result.unix).toBeGreaterThan(0);
      expect(result.days_until).toBeGreaterThanOrEqual(0);
      expect(result.days_until).toBeLessThanOrEqual(1);
    } finally {
      await cleanup();
    }
  });

  it('should execute next_occurrence for weekly pattern', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'next_occurrence', {
        pattern: 'weekly',
        day_of_week: 1, // Monday
        time: '09:00',
        timezone: 'America/New_York',
      });

      expect(result.next).toBeDefined();
      const nextDate = new Date(result.next);
      expect(nextDate.getUTCDay()).toBe(1); // Monday
      expect(result.days_until).toBeGreaterThanOrEqual(0);
      expect(result.days_until).toBeLessThanOrEqual(7);
    } finally {
      await cleanup();
    }
  });

  it('should execute next_occurrence for monthly pattern', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'next_occurrence', {
        pattern: 'monthly',
        day_of_month: 15,
        time: '12:00',
        start_from: '2024-01-01T00:00:00Z',
      });

      // Time is interpreted in system timezone and converted to UTC
      expect(result.next).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.days_until).toBeGreaterThanOrEqual(0);
    } finally {
      await cleanup();
    }
  });

  it('should handle validation errors', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      await expect(
        callTool(client, 'next_occurrence', {
          pattern: 'invalid-pattern',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_PARAMETER',
        message: expect.stringContaining('Invalid pattern'),
      });
    } finally {
      await cleanup();
    }
  });
});
