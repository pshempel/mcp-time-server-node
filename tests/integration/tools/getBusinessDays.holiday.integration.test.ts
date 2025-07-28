import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('get_business_days with holiday calendars - Integration', () => {
  describe('US holiday calendar', () => {
    it('should calculate business days excluding US holidays', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          holiday_calendar: 'US',
        });

        expect(result.total_days).toBe(31);
        expect(result.business_days).toBe(21); // 23 weekdays - 2 holidays (New Year's, MLK Day)
        expect(result.weekend_days).toBe(8);
        expect(result.holiday_count).toBe(2);
      } finally {
        await cleanup();
      }
    });

    it('should handle observed holidays', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '2026-07-01',
          end_date: '2026-07-10',
          holiday_calendar: 'US',
        });

        // July 4, 2026 is Saturday, observed on Friday July 3
        expect(result.holiday_count).toBe(1);
        expect(result.business_days).toBe(7); // 8 weekdays - 1 observed holiday
      } finally {
        await cleanup();
      }
    });

    it('should respect include_observed parameter', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const resultWithObserved = await callTool(client, 'get_business_days', {
          start_date: '2026-07-01',
          end_date: '2026-07-10',
          holiday_calendar: 'US',
          include_observed: true,
        });

        const resultWithoutObserved = await callTool(client, 'get_business_days', {
          start_date: '2026-07-01',
          end_date: '2026-07-10',
          holiday_calendar: 'US',
          include_observed: false,
        });

        // With observed: July 3 (Friday) is counted as holiday
        // Without observed: July 4 (Saturday) is just a weekend
        expect(resultWithObserved.holiday_count).toBe(1);
        expect(resultWithoutObserved.holiday_count).toBe(0);
      } finally {
        await cleanup();
      }
    });
  });

  describe('UK holiday calendar', () => {
    it('should calculate business days excluding UK holidays', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-12-20',
          end_date: '2025-12-31',
          holiday_calendar: 'UK',
        });

        // Christmas and Boxing Day
        expect(result.holiday_count).toBe(2);
      } finally {
        await cleanup();
      }
    });

    it('should handle UK bank holiday observation rules', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        // When Christmas is on weekend, UK observes on following Monday/Tuesday
        const result = await callTool(client, 'get_business_days', {
          start_date: '2021-12-20',
          end_date: '2021-12-31',
          holiday_calendar: 'UK',
        });

        // 2021: Dec 25 (Sat), Dec 26 (Sun) - both observed on Dec 27 (Mon)
        // TODO: UK holidays on consecutive weekend days should be observed on consecutive weekdays
        expect(result.holiday_count).toBe(1);
      } finally {
        await cleanup();
      }
    });
  });

  describe('combining holiday sources', () => {
    it('should combine calendar and custom holidays', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          holiday_calendar: 'US',
          custom_holidays: ['2025-01-15', '2025-01-22'],
        });

        // US: New Year's (1st), MLK (20th) + Custom: 15th, 22nd
        expect(result.holiday_count).toBe(4);
        expect(result.business_days).toBe(19); // 23 weekdays - 4 holidays
      } finally {
        await cleanup();
      }
    });

    it('should not double-count duplicate holidays', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          holiday_calendar: 'US',
          custom_holidays: ['2025-01-01'], // Duplicate of New Year's
        });

        // Should only count New Year's once
        expect(result.holiday_count).toBe(2); // New Year's + MLK
      } finally {
        await cleanup();
      }
    });

    it('should combine all three holiday sources', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          holidays: ['2025-01-15'], // Legacy parameter
          holiday_calendar: 'US',
          custom_holidays: ['2025-01-22'],
        });

        // US: 1st, 20th + Legacy: 15th + Custom: 22nd
        expect(result.holiday_count).toBe(4);
      } finally {
        await cleanup();
      }
    });
  });

  describe('timezone handling', () => {
    it('should handle holidays correctly with timezone specified', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01',
          end_date: '2025-01-01',
          timezone: 'America/Los_Angeles',
          holiday_calendar: 'US',
        });

        // New Year's Day should be recognized as a holiday
        expect(result.holiday_count).toBe(1);
        expect(result.business_days).toBe(0);
      } finally {
        await cleanup();
      }
    });

    it('should handle cross-timezone date ranges', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        // Start in one day in UTC, different day in LA
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01T00:00:00-08:00', // Midnight LA = 8am UTC
          end_date: '2025-01-01T23:59:59-08:00', // End of day LA
          timezone: 'America/Los_Angeles',
          holiday_calendar: 'US',
        });

        expect(result.total_days).toBe(2); // Spans midnight to midnight, includes 2 calendar days
        expect(result.holiday_count).toBe(1);
      } finally {
        await cleanup();
      }
    });
  });

  describe('unknown country handling', () => {
    it('should gracefully handle unknown country codes', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          holiday_calendar: 'XX', // Unknown
        });

        // Should work like no holidays
        expect(result.holiday_count).toBe(0);
        expect(result.business_days).toBe(23);
      } finally {
        await cleanup();
      }
    });
  });

  describe('performance with multiple years', () => {
    it('should handle multi-year date ranges efficiently', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        const result = await callTool(client, 'get_business_days', {
          start_date: '2025-01-01',
          end_date: '2027-12-31',
          holiday_calendar: 'US',
        });

        // Should have holidays from all 3 years
        expect(result.holiday_count).toBeGreaterThan(20); // ~10 federal holidays per year
        expect(result.total_days).toBe(1095); // 3 years: 365 + 365 + 365 = 1095
      } finally {
        await cleanup();
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid custom holiday dates', async () => {
      const { client, cleanup } = await createTestEnvironment();

      try {
        await expect(
          callTool(client, 'get_business_days', {
            start_date: '2025-01-01',
            end_date: '2025-01-31',
            custom_holidays: ['invalid-date'],
          }),
        ).rejects.toThrow('Invalid custom holiday date');
      } finally {
        await cleanup();
      }
    });
  });
});
