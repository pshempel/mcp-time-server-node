import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';
import { addDays, subDays, format } from 'date-fns';

describe('days_until integration', () => {
  it('should calculate days until a future date', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const futureDate = addDays(new Date(), 7);
      const dateString = format(futureDate, 'yyyy-MM-dd');

      const result = await callTool(client, 'days_until', {
        target_date: dateString,
      });

      expect(result).toBe(7);
    } finally {
      await cleanup();
    }
  });

  it('should return 0 for today', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const result = await callTool(client, 'days_until', {
        target_date: today,
      });

      expect(result).toBe(0);
    } finally {
      await cleanup();
    }
  });

  it('should return negative days for past dates', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const pastDate = subDays(new Date(), 5);
      const dateString = format(pastDate, 'yyyy-MM-dd');

      const result = await callTool(client, 'days_until', {
        target_date: dateString,
      });

      expect(result).toBe(-5);
    } finally {
      await cleanup();
    }
  });

  it('should format as "Today" when format_result is true', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const result = await callTool(client, 'days_until', {
        target_date: today,
        format_result: true,
      });

      expect(result).toBe('Today');
    } finally {
      await cleanup();
    }
  });

  it('should format as "Tomorrow" for next day', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const tomorrow = addDays(new Date(), 1);
      const dateString = format(tomorrow, 'yyyy-MM-dd');

      const result = await callTool(client, 'days_until', {
        target_date: dateString,
        format_result: true,
      });

      expect(result).toBe('Tomorrow');
    } finally {
      await cleanup();
    }
  });

  it('should format as "in N days" for future dates', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const futureDate = addDays(new Date(), 10);
      const dateString = format(futureDate, 'yyyy-MM-dd');

      const result = await callTool(client, 'days_until', {
        target_date: dateString,
        format_result: true,
      });

      expect(result).toBe('in 10 days');
    } finally {
      await cleanup();
    }
  });

  it('should handle specific timezone', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const futureDate = '2025-12-25T00:00:00';

      const result = await callTool(client, 'days_until', {
        target_date: futureDate,
        timezone: 'America/New_York',
      });

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(365);
    } finally {
      await cleanup();
    }
  });

  it('should use UTC when timezone is empty string', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const tomorrow = addDays(new Date(), 1);
      const utcString = tomorrow.toISOString();

      const result = await callTool(client, 'days_until', {
        target_date: utcString,
        timezone: '',
      });

      expect(result).toBe(1);
    } finally {
      await cleanup();
    }
  });

  it('should throw error for missing target_date', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      await expect(callTool(client, 'days_until', {})).rejects.toMatchObject({
        code: 'INVALID_PARAMETER',
        message: expect.stringContaining('target_date is required'),
      });
    } finally {
      await cleanup();
    }
  });

  it('should throw error for invalid date', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      await expect(
        callTool(client, 'days_until', {
          target_date: 'not-a-date',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_DATE_FORMAT',
        message: expect.stringContaining('Invalid target_date format'),
      });
    } finally {
      await cleanup();
    }
  });

  it('should throw error for invalid timezone', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      await expect(
        callTool(client, 'days_until', {
          target_date: '2025-12-25',
          timezone: 'Invalid/Timezone',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_TIMEZONE',
        message: expect.stringContaining('Invalid timezone'),
      });
    } finally {
      await cleanup();
    }
  });

  it('should handle Christmas countdown', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'days_until', {
        target_date: '2025-12-25',
        format_result: false,
      });

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(365);
    } finally {
      await cleanup();
    }
  });

  it('should handle event planning with formatted output', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const eventDate = addDays(new Date(), 30);

      const result = await callTool(client, 'days_until', {
        target_date: eventDate.toISOString(),
        timezone: 'America/New_York',
        format_result: true,
      });

      expect(result).toBe('in 30 days');
    } finally {
      await cleanup();
    }
  });
});
