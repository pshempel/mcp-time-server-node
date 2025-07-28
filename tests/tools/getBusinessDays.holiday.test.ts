import { getBusinessDays } from '../../src/tools/getBusinessDays';
import type { GetBusinessDaysParams } from '../../src/types';

describe('getBusinessDays with holiday calendar support', () => {
  describe('holiday_calendar parameter', () => {
    it('should subtract US holidays from business days', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        holiday_calendar: 'US',
      };

      const result = getBusinessDays(params);

      // January 2025: 31 days, 8 weekend days
      // Holidays: Jan 1 (New Year's), Jan 20 (MLK Day)
      // Business days: 31 - 8 - 2 = 21
      expect(result.total_days).toBe(31);
      expect(result.weekend_days).toBe(8);
      expect(result.holiday_count).toBe(2);
      expect(result.business_days).toBe(21);
    });

    it('should handle observed holidays correctly', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2026-07-01',
        end_date: '2026-07-31',
        holiday_calendar: 'US',
      };

      const result = getBusinessDays(params);

      // July 2026: July 4 is Saturday, observed on Friday July 3
      // Business days should exclude July 3 (observed), not July 4 (weekend)
      expect(result.holiday_count).toBe(1); // Only count the observed date
      expect(result.business_days).toBe(22); // 23 weekdays - 1 observed holiday
    });

    it('should work with UK holidays', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2025-12-20',
        end_date: '2025-12-31',
        holiday_calendar: 'UK',
      };

      const result = getBusinessDays(params);

      // December 20-31: Christmas (25th) and Boxing Day (26th)
      // Both are weekdays in 2025
      expect(result.holiday_count).toBe(2);
    });

    it('should handle unknown country gracefully', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        holiday_calendar: 'XX', // Unknown country
      };

      const result = getBusinessDays(params);

      // Should work like no holidays
      expect(result.holiday_count).toBe(0);
      expect(result.business_days).toBe(23); // Just weekdays
    });
  });

  describe('include_observed parameter', () => {
    it('should use observed dates when include_observed is true (default)', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2026-12-20',
        end_date: '2026-12-31',
        holiday_calendar: 'US',
        // include_observed defaults to true
      };

      const result = getBusinessDays(params);

      // Christmas 2026 is Friday (Dec 25)
      // No observation needed, just regular holiday
      expect(result.holiday_count).toBe(1);
    });

    it('should ignore observed dates when include_observed is false', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2027-12-20',
        end_date: '2027-12-31',
        holiday_calendar: 'US',
        include_observed: false,
      };

      const result = getBusinessDays(params);

      // Christmas 2027 is Saturday (Dec 25)
      // With include_observed: false, it's just a weekend day
      // No holiday should be counted
      expect(result.holiday_count).toBe(0);
    });
  });

  describe('custom_holidays parameter', () => {
    it('should combine calendar and custom holidays', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2025-06-01',
        end_date: '2025-06-30',
        holiday_calendar: 'US',
        custom_holidays: ['2025-06-19'], // Juneteenth (not in federal list yet)
      };

      const result = getBusinessDays(params);

      // June 2025: No US federal holidays, but we added Juneteenth
      expect(result.holiday_count).toBe(1);
    });

    it('should not double-count holidays', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2025-07-01',
        end_date: '2025-07-31',
        holiday_calendar: 'US',
        custom_holidays: ['2025-07-04'], // Duplicate of Independence Day
      };

      const result = getBusinessDays(params);

      // Should only count July 4th once
      expect(result.holiday_count).toBe(1);
    });
  });

  describe('backward compatibility', () => {
    it('should still work with legacy holidays parameter', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        holidays: ['2025-01-15', '2025-01-22'], // Legacy parameter
      };

      const result = getBusinessDays(params);

      expect(result.holiday_count).toBe(2);
      expect(result.business_days).toBe(21); // 23 weekdays - 2 holidays
    });

    it('should combine all holiday sources', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        holidays: ['2025-01-15'], // Legacy
        holiday_calendar: 'US', // Calendar holidays
        custom_holidays: ['2025-01-22'], // Custom
      };

      const result = getBusinessDays(params);

      // Should have: Jan 1 (New Year's), Jan 15 (legacy), Jan 20 (MLK), Jan 22 (custom)
      expect(result.holiday_count).toBe(4);
      expect(result.business_days).toBe(19); // 23 weekdays - 4 holidays
    });
  });

  describe('timezone handling with holidays', () => {
    it('should interpret holiday dates in the business timezone', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2025-01-01',
        end_date: '2025-01-01',
        timezone: 'America/Los_Angeles',
        holiday_calendar: 'US',
      };

      const result = getBusinessDays(params);

      // Jan 1, 2025 is New Year's Day
      expect(result.holiday_count).toBe(1);
      expect(result.business_days).toBe(0); // Holiday
    });
  });

  describe('caching with holiday calendar', () => {
    it('should cache results with holiday calendar in key', () => {
      const params: GetBusinessDaysParams = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        holiday_calendar: 'US',
      };

      const result1 = getBusinessDays(params);
      const result2 = getBusinessDays(params);

      // Should return same cached result
      expect(result2).toEqual(result1);
    });

    it('should use different cache for different calendars', () => {
      const paramsUS: GetBusinessDaysParams = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        holiday_calendar: 'US',
      };

      const paramsUK: GetBusinessDaysParams = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        holiday_calendar: 'UK',
      };

      const resultUS = getBusinessDays(paramsUS);
      const resultUK = getBusinessDays(paramsUK);

      // Different holiday counts for different countries
      expect(resultUS.holiday_count).not.toBe(resultUK.holiday_count);
    });
  });
});
