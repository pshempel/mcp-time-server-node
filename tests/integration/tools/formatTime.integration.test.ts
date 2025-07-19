import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('format_time integration', () => {
  it('should execute format_time with relative format', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = await callTool(client, 'format_time', {
        time: yesterday.toISOString(),
        format: 'relative',
      });

      expect(result.formatted).toMatch(/yesterday|1 day ago/);
      expect(result.original).toBe(yesterday.toISOString());
    } finally {
      await cleanup();
    }
  });

  it('should execute format_time with calendar format', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'format_time', {
        time: '2024-01-15T14:30:00Z',
        format: 'calendar',
      });

      expect(result.formatted).toMatch(/01.15.2024|January 15/);
      expect(result.original).toBe('2024-01-15T14:30:00.000Z');
    } finally {
      await cleanup();
    }
  });

  it('should execute format_time with custom format', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'format_time', {
        time: '2024-01-15T14:30:00Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd HH:mm',
      });

      // Format is timezone-aware, so the time might be different
      expect(result.formatted).toMatch(/2024-01-15 \d{2}:\d{2}/);
      expect(result.original).toBe('2024-01-15T14:30:00.000Z');
    } finally {
      await cleanup();
    }
  });

  it('should handle timezone in formatting', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'format_time', {
        time: '2024-01-15T14:30:00Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd HH:mm zzz',
        timezone: 'America/New_York',
      });

      expect(result.formatted).toMatch(/2024-01-15 09:30/);
    } finally {
      await cleanup();
    }
  });

  it('should handle validation errors', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      await expect(
        callTool(client, 'format_time', {
          time: 'invalid-date',
          format: 'relative',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_DATE_FORMAT',
        message: expect.stringContaining('Invalid'),
      });
    } finally {
      await cleanup();
    }
  });
});
