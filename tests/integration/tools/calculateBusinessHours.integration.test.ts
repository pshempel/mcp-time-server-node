import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('calculate_business_hours integration', () => {
  it('should calculate business hours for a single day', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_business_hours', {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T15:00:00',
      });

      expect(result.total_business_hours).toBe(5);
      expect(result.total_business_minutes).toBe(300);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0]).toMatchObject({
        date: '2025-01-20',
        day_of_week: 'Monday',
        business_minutes: 300,
        is_weekend: false,
        is_holiday: false,
      });
    } finally {
      await cleanup();
    }
  });

  it('should handle custom business hours', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_business_hours', {
        start_time: '2025-01-20T08:00:00',
        end_time: '2025-01-20T18:00:00',
        business_hours: {
          start: { hour: 8, minute: 30 },
          end: { hour: 17, minute: 30 },
        },
      });

      expect(result.total_business_hours).toBe(9); // 8:30 AM - 5:30 PM
    } finally {
      await cleanup();
    }
  });

  it('should handle weekends correctly', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_business_hours', {
        start_time: '2025-01-24T10:00:00', // Friday
        end_time: '2025-01-27T10:00:00', // Monday
      });

      // Friday: 7 hours (10 AM - 5 PM)
      // Saturday/Sunday: 0 (weekends)
      // Monday: 1 hour (9 AM - 10 AM)
      expect(result.total_business_hours).toBe(8);
    } finally {
      await cleanup();
    }
  });

  it('should handle holidays', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_business_hours', {
        start_time: '2025-01-20T09:00:00',
        end_time: '2025-01-22T17:00:00',
        holidays: ['2025-01-21'], // Tuesday is a holiday
      });

      // Monday: 8 hours, Tuesday: 0 (holiday), Wednesday: 8 hours
      expect(result.total_business_hours).toBe(16);
    } finally {
      await cleanup();
    }
  });

  it('should handle timezone parameter', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_business_hours', {
        start_time: '2025-01-21T10:00:00',
        end_time: '2025-01-21T14:00:00',
        timezone: 'Asia/Tokyo',
      });

      expect(result.total_business_hours).toBe(4);
      expect(result.breakdown[0].date).toBe('2025-01-21');
    } finally {
      await cleanup();
    }
  });

  it('should handle weekly business hours schedule', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_business_hours', {
        start_time: '2025-01-20T09:00:00', // Monday
        end_time: '2025-01-24T17:00:00', // Friday
        business_hours: {
          0: null, // Sunday - closed
          1: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Monday
          2: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Tuesday
          3: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Wednesday
          4: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Thursday
          5: { start: { hour: 9, minute: 0 }, end: { hour: 13, minute: 0 } }, // Friday - half day
          6: null, // Saturday - closed
        },
      });

      // Mon-Thu: 8 hours each = 32 hours
      // Friday: 4 hours
      expect(result.total_business_hours).toBe(36);
    } finally {
      await cleanup();
    }
  });

  it('should handle invalid timezone', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      await expect(
        callTool(client, 'calculate_business_hours', {
          start_time: '2025-01-20T10:00:00',
          end_time: '2025-01-20T14:00:00',
          timezone: 'Invalid/Zone',
        })
      ).rejects.toMatchObject({
        code: 'TOOL_ERROR',
        message: 'Invalid timezone: Invalid/Zone',
      });
    } finally {
      await cleanup();
    }
  });

  it('should handle invalid date format', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      await expect(
        callTool(client, 'calculate_business_hours', {
          start_time: 'not-a-date',
          end_time: '2025-01-20T14:00:00',
        })
      ).rejects.toMatchObject({
        code: 'TOOL_ERROR',
        message: 'Invalid start_time format: not-a-date',
      });
    } finally {
      await cleanup();
    }
  });

  it('should use UTC with empty string timezone', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_business_hours', {
        start_time: '2025-01-20T14:00:00',
        end_time: '2025-01-20T17:00:00',
        timezone: '',
      });

      expect(result.total_business_hours).toBe(3); // 2 PM - 5 PM UTC
    } finally {
      await cleanup();
    }
  });

  it('should include weekends when specified', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_business_hours', {
        start_time: '2025-01-25T10:00:00', // Saturday
        end_time: '2025-01-25T14:00:00', // Saturday
        include_weekends: true,
      });

      expect(result.total_business_hours).toBe(4);
      expect(result.breakdown[0].is_weekend).toBe(true);
      expect(result.breakdown[0].business_minutes).toBe(240);
    } finally {
      await cleanup();
    }
  });
});
