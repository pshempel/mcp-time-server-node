import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('get_business_days integration', () => {
  it('should execute get_business_days with basic parameters', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'get_business_days', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });

      expect(result.total_days).toBe(31);
      expect(result.business_days).toBe(23);
      expect(result.weekend_days).toBe(8);
      expect(result.holiday_count).toBe(0);
    } finally {
      await cleanup();
    }
  });

  it('should handle holidays', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'get_business_days', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        holidays: ['2024-01-01', '2024-01-15'],
      });

      expect(result.total_days).toBe(31);
      expect(result.business_days).toBe(21);
      expect(result.weekend_days).toBe(8);
      expect(result.holiday_count).toBe(2);
    } finally {
      await cleanup();
    }
  });

  it('should handle include weekends option', async () => {
    const { client, cleanup } = await createTestEnvironment();

    try {
      const result = await callTool(client, 'get_business_days', {
        start_date: '2024-01-01',
        end_date: '2024-01-07',
        exclude_weekends: false,
      });

      expect(result.total_days).toBe(7);
      expect(result.business_days).toBe(7);
      expect(result.weekend_days).toBe(2); // Jan 1-7, 2024 includes Sat 6th and Sun 7th
    } finally {
      await cleanup();
    }
  });
});
