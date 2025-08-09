/**
 * Tests for extracted functions from calculateBusinessHours refactor
 * Following TDD approach - writing tests before implementation
 */

import type { BusinessHours, DayBusinessHours } from '../../src/types';
import {
  generateDateRange,
  processSingleBusinessDay,
  buildBusinessHoursResult,
} from '../../src/tools/calculateBusinessHours';

describe('calculateBusinessHours extracted functions', () => {
  describe('generateDateRange', () => {
    it('should generate single date for same day range', () => {
      const startDate = new Date('2025-01-20T10:00:00Z');
      const endDate = new Date('2025-01-20T15:00:00Z');
      const timezone = 'America/New_York';

      // Expected: Just one date
      const expected = ['2025-01-20'];

      const result = generateDateRange(startDate, endDate, timezone);
      expect(result).toEqual(expected);
    });

    it('should generate multiple dates for multi-day range', () => {
      const startDate = new Date('2025-01-20T10:00:00Z');
      const endDate = new Date('2025-01-22T15:00:00Z');
      const timezone = 'America/New_York';

      // Expected: Three consecutive dates
      const expected = ['2025-01-20', '2025-01-21', '2025-01-22'];

      const result = generateDateRange(startDate, endDate, timezone);
      expect(result).toEqual(expected);
    });

    it('should handle timezone correctly for date boundaries', () => {
      // Test case where UTC date differs from local date
      const startDate = new Date('2025-01-20T23:00:00Z'); // Jan 21 in Tokyo
      const endDate = new Date('2025-01-21T01:00:00Z'); // Jan 21 in Tokyo
      const timezone = 'Asia/Tokyo';

      // Expected: Just Jan 21 in Tokyo timezone
      const expected = ['2025-01-21'];

      const result = generateDateRange(startDate, endDate, timezone);
      expect(result).toEqual(expected);
    });

    it('should not duplicate dates', () => {
      // Edge case: range spans midnight
      const startDate = new Date('2025-01-20T22:00:00Z');
      const endDate = new Date('2025-01-21T02:00:00Z');
      const timezone = 'UTC';

      // Expected: Two dates without duplicates
      const expected = ['2025-01-20', '2025-01-21'];

      const result = generateDateRange(startDate, endDate, timezone);
      expect(result).toEqual(expected);
    });
  });

  describe('processSingleBusinessDay', () => {
    const defaultBusinessHours: BusinessHours = {
      start: { hour: 9, minute: 0 },
      end: { hour: 17, minute: 0 },
    };

    it('should calculate full day business hours', () => {
      const params = {
        dayDateStr: '2025-01-20',
        startDate: new Date('2025-01-20T08:00:00Z'), // Before business hours
        endDate: new Date('2025-01-20T18:00:00Z'), // After business hours
        timezone: 'UTC',
        businessHours: defaultBusinessHours,
        holidayDates: [],
        include_weekends: false,
        dayOfWeek: 1, // Monday
        isWeekend: false,
      };

      // Expected: 8 hours (9 AM - 5 PM)
      const expectedMinutes = 480;
      const expectedDayResult = {
        date: '2025-01-20',
        day_of_week: 'Monday',
        business_minutes: 480,
        is_weekend: false,
        is_holiday: false,
      };

      const result = processSingleBusinessDay(params);
      expect(result.minutes).toBe(expectedMinutes);
      expect(result.dayResult).toEqual(expectedDayResult);
    });

    it('should calculate partial day at start', () => {
      const params = {
        dayDateStr: '2025-01-20',
        startDate: new Date('2025-01-20T10:00:00Z'), // 10 AM - after business start
        endDate: new Date('2025-01-20T18:00:00Z'), // After business hours
        timezone: 'UTC',
        businessHours: defaultBusinessHours,
        holidayDates: [],
        include_weekends: false,
        dayOfWeek: 1, // Monday
        isWeekend: false,
      };

      // Expected: 7 hours (10 AM - 5 PM)
      const expectedMinutes = 420;

      const result = processSingleBusinessDay(params);
      expect(result.minutes).toBe(expectedMinutes);
    });

    it('should calculate partial day at end', () => {
      const params = {
        dayDateStr: '2025-01-20',
        startDate: new Date('2025-01-20T08:00:00Z'), // Before business hours
        endDate: new Date('2025-01-20T15:00:00Z'), // 3 PM - before business end
        timezone: 'UTC',
        businessHours: defaultBusinessHours,
        holidayDates: [],
        include_weekends: false,
        dayOfWeek: 1, // Monday
        isWeekend: false,
      };

      // Expected: 6 hours (9 AM - 3 PM)
      const expectedMinutes = 360;

      const result = processSingleBusinessDay(params);
      expect(result.minutes).toBe(expectedMinutes);
    });

    it('should return 0 minutes for weekend when not included', () => {
      const params = {
        dayDateStr: '2025-01-25',
        startDate: new Date('2025-01-25T08:00:00Z'),
        endDate: new Date('2025-01-25T18:00:00Z'),
        timezone: 'UTC',
        businessHours: defaultBusinessHours,
        holidayDates: [],
        include_weekends: false,
        dayOfWeek: 6, // Saturday
        isWeekend: true,
      };

      const expectedMinutes = 0;
      const expectedDayResult = {
        date: '2025-01-25',
        day_of_week: 'Saturday',
        business_minutes: 0,
        is_weekend: true,
        is_holiday: false,
      };

      const result = processSingleBusinessDay(params);
      expect(result.minutes).toBe(expectedMinutes);
      expect(result.dayResult).toEqual(expectedDayResult);
    });

    it('should return 0 minutes for holiday', () => {
      // Create holiday date that will format to '2025-01-20' in UTC
      // Since we're using UTC timezone, create the date at UTC midnight
      const holidayDate = new Date(Date.UTC(2025, 0, 20, 0, 0, 0));
      const params = {
        dayDateStr: '2025-01-20',
        startDate: new Date('2025-01-20T08:00:00Z'),
        endDate: new Date('2025-01-20T18:00:00Z'),
        timezone: 'UTC',
        businessHours: defaultBusinessHours,
        holidayDates: [holidayDate],
        include_weekends: false,
        dayOfWeek: 1, // Monday
        isWeekend: false,
      };

      const expectedMinutes = 0;
      const expectedDayResult = {
        date: '2025-01-20',
        day_of_week: 'Monday',
        business_minutes: 0,
        is_weekend: false,
        is_holiday: true,
      };

      const result = processSingleBusinessDay(params);
      expect(result.minutes).toBe(expectedMinutes);
      expect(result.dayResult).toEqual(expectedDayResult);
    });

    it('should include weekend when include_weekends is true', () => {
      const params = {
        dayDateStr: '2025-01-25',
        startDate: new Date('2025-01-25T08:00:00Z'),
        endDate: new Date('2025-01-25T18:00:00Z'),
        timezone: 'UTC',
        businessHours: defaultBusinessHours,
        holidayDates: [],
        include_weekends: true, // Include weekends
        dayOfWeek: 6, // Saturday
        isWeekend: true,
      };

      const expectedMinutes = 480; // Full business day

      const result = processSingleBusinessDay(params);
      expect(result.minutes).toBe(expectedMinutes);
    });
  });

  describe('buildBusinessHoursResult', () => {
    it('should aggregate results correctly', () => {
      const breakdown: DayBusinessHours[] = [
        {
          date: '2025-01-20',
          day_of_week: 'Monday',
          business_minutes: 480,
          is_weekend: false,
          is_holiday: false,
        },
        {
          date: '2025-01-21',
          day_of_week: 'Tuesday',
          business_minutes: 360,
          is_weekend: false,
          is_holiday: false,
        },
        {
          date: '2025-01-22',
          day_of_week: 'Wednesday',
          business_minutes: 0,
          is_weekend: false,
          is_holiday: true,
        },
      ];

      const totalMinutes = 840; // 480 + 360

      const expected = {
        total_business_minutes: 840,
        total_business_hours: 14, // 840 / 60
        breakdown,
      };

      const result = buildBusinessHoursResult(breakdown, totalMinutes);
      expect(result).toEqual(expected);
    });

    it('should handle empty breakdown', () => {
      const breakdown: DayBusinessHours[] = [];
      const totalMinutes = 0;

      const expected = {
        total_business_minutes: 0,
        total_business_hours: 0,
        breakdown: [],
      };

      const result = buildBusinessHoursResult(breakdown, totalMinutes);
      expect(result).toEqual(expected);
    });
  });
});
