import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('calculate_duration integration', () => {
  it('should execute calculate_duration with basic parameters', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_duration', {
        start_time: '2024-01-15T10:00:00.000Z',
        end_time: '2024-01-15T15:30:00.000Z',
      });

      expect(result.hours).toBe(5.5);
      expect(result.minutes).toBe(330);
      expect(result.seconds).toBe(19800);
      expect(result.milliseconds).toBe(19800000);
      expect(result.days).toBeCloseTo(0.229167, 5);
      expect(result.formatted).toBe('5 hours 30 minutes');
      expect(result.is_negative).toBe(false);
    } finally {
      await cleanup();
    }
  });

  it('should handle negative duration', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_duration', {
        start_time: '2024-01-15T15:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
      });

      expect(result.hours).toBe(-5);
      expect(result.is_negative).toBe(true);
      expect(result.formatted).toMatch(/^-5 hours/);
    } finally {
      await cleanup();
    }
  });

  it('should handle calculate_duration with timezone', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'calculate_duration', {
        start_time: '2024-01-15T10:00:00',
        end_time: '2024-01-15T15:00:00',
        timezone: 'America/New_York',
      });

      expect(result.hours).toBe(5);
      expect(result.minutes).toBe(300);
    } finally {
      await cleanup();
    }
  });
});
