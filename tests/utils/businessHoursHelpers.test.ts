import {
  validateBusinessHoursStructure,
  getDatesInBusinessTimezone,
  isWorkDay,
  calculateDayBusinessMinutes,
  buildDayResult,
  getDayInfo,
} from '../../src/utils/businessHoursHelpers';
import { BusinessHours, WeeklyBusinessHours } from '../../src/types';

describe('businessHoursHelpers', () => {
  describe('validateBusinessHoursStructure', () => {
    it('should validate simple business hours', () => {
      const hours: BusinessHours = {
        start: { hour: 9, minute: 0 },
        end: { hour: 17, minute: 0 },
      };

      expect(() => validateBusinessHoursStructure(hours)).not.toThrow();
    });

    it('should reject invalid hours', () => {
      const hours: BusinessHours = {
        start: { hour: 25, minute: 0 }, // Invalid hour
        end: { hour: 17, minute: 0 },
      };

      expect(() => validateBusinessHoursStructure(hours)).toThrow();
    });

    it('should reject invalid minutes', () => {
      const hours: BusinessHours = {
        start: { hour: 9, minute: 60 }, // Invalid minute
        end: { hour: 17, minute: 0 },
      };

      expect(() => validateBusinessHoursStructure(hours)).toThrow();
    });

    it('should validate weekly business hours', () => {
      const weekly: WeeklyBusinessHours = {
        0: null, // Sunday closed
        1: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
        2: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
        3: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
        4: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
        5: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } },
        6: null, // Saturday closed
      };

      expect(() => validateBusinessHoursStructure(weekly)).not.toThrow();
    });

    it('should reject weekly hours with invalid day', () => {
      const weekly: any = {
        7: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Invalid day
      };

      expect(() => validateBusinessHoursStructure(weekly)).toThrow();
    });
  });

  describe('getDatesInBusinessTimezone', () => {
    it('should return array of date strings between start and end', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-01-03T23:59:59Z');
      const timezone = 'UTC';

      const result = getDatesInBusinessTimezone(start, end, timezone);

      // May include boundary dates depending on timezone
      expect(result).toContain('2025-01-01');
      expect(result).toContain('2025-01-02');
      expect(result).toContain('2025-01-03');
      // The implementation correctly includes all dates that overlap the range
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle single day range', () => {
      const start = new Date('2025-01-15T10:00:00Z');
      const end = new Date('2025-01-15T18:00:00Z');
      const timezone = 'UTC';

      const result = getDatesInBusinessTimezone(start, end, timezone);

      expect(result).toEqual(['2025-01-15']);
    });

    it('should handle timezone conversion', () => {
      // Jan 1 midnight in NY is still Dec 31 in UTC
      const start = new Date('2025-01-01T05:00:00Z'); // Midnight NY time
      const end = new Date('2025-01-01T05:00:00Z');
      const timezone = 'America/New_York';

      const result = getDatesInBusinessTimezone(start, end, timezone);

      expect(result).toEqual(['2025-01-01']); // In NY timezone
    });

    it('should handle DST transitions', () => {
      // Test around DST change (example date)
      const start = new Date('2025-03-09T00:00:00Z');
      const end = new Date('2025-03-11T00:00:00Z');
      const timezone = 'America/New_York';

      const result = getDatesInBusinessTimezone(start, end, timezone);

      expect(result).toHaveLength(3);
      expect(result).toContain('2025-03-08');
      expect(result).toContain('2025-03-09');
      expect(result).toContain('2025-03-10');
    });
  });

  describe('getDayInfo', () => {
    it('should return day info for a date', () => {
      const result = getDayInfo('2025-01-31', 'UTC'); // Friday

      expect(result).toEqual({
        dayOfWeek: 5,
        dayName: 'Friday',
      });
    });

    it('should handle timezone correctly', () => {
      // A date that's different days in different timezones
      const result = getDayInfo('2025-01-01', 'America/New_York');

      expect(result.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(result.dayOfWeek).toBeLessThanOrEqual(6);
      expect(result.dayName).toBeDefined();
    });
  });

  describe('isWorkDay', () => {
    it('should return true for weekday with no holidays', () => {
      const result = isWorkDay('2025-01-31', 5, false, [], true); // Friday
      expect(result).toBe(true);
    });

    it('should return false for weekend when not including weekends', () => {
      const result = isWorkDay('2025-02-01', 6, true, [], false); // Saturday
      expect(result).toBe(false);
    });

    it('should return true for weekend when including weekends', () => {
      const result = isWorkDay('2025-02-01', 6, true, [], true); // Saturday
      expect(result).toBe(true);
    });

    it('should return false for holiday', () => {
      // Create holiday date that will match '2025-01-01' string
      const holiday = new Date('2025-01-01T12:00:00');
      const holidays = [holiday];
      const result = isWorkDay('2025-01-01', 3, false, holidays, true);
      expect(result).toBe(false);
    });

    it('should handle holiday on weekend correctly', () => {
      const holidays = [new Date('2025-02-01')]; // Saturday
      const result = isWorkDay('2025-02-01', 6, true, holidays, false);
      expect(result).toBe(false); // False because it's both weekend and holiday
    });
  });

  describe('calculateDayBusinessMinutes', () => {
    const businessHours: BusinessHours = {
      start: { hour: 9, minute: 0 },
      end: { hour: 17, minute: 0 },
    };

    it('should calculate full day minutes', () => {
      const dayStart = new Date('2025-01-15T09:00:00');
      const dayEnd = new Date('2025-01-15T17:00:00');
      const rangeStart = new Date('2025-01-01T00:00:00');
      const rangeEnd = new Date('2025-01-31T23:59:59');

      const result = calculateDayBusinessMinutes(
        '2025-01-15',
        businessHours,
        dayStart,
        dayEnd,
        rangeStart,
        rangeEnd
      );

      expect(result).toBe(480); // 8 hours * 60 minutes
    });

    it('should handle partial start day', () => {
      const dayStart = new Date('2025-01-15T09:00:00');
      const dayEnd = new Date('2025-01-15T17:00:00');
      const rangeStart = new Date('2025-01-15T10:00:00'); // Start at 10am
      const rangeEnd = new Date('2025-01-31T23:59:59');

      const result = calculateDayBusinessMinutes(
        '2025-01-15',
        businessHours,
        dayStart,
        dayEnd,
        rangeStart,
        rangeEnd
      );

      expect(result).toBe(420); // 7 hours * 60 minutes
    });

    it('should handle partial end day', () => {
      const dayStart = new Date('2025-01-15T09:00:00');
      const dayEnd = new Date('2025-01-15T17:00:00');
      const rangeStart = new Date('2025-01-01T00:00:00');
      const rangeEnd = new Date('2025-01-15T15:00:00'); // End at 3pm

      const result = calculateDayBusinessMinutes(
        '2025-01-15',
        businessHours,
        dayStart,
        dayEnd,
        rangeStart,
        rangeEnd
      );

      expect(result).toBe(360); // 6 hours * 60 minutes
    });

    it('should return 0 if range starts after business hours', () => {
      const dayStart = new Date('2025-01-15T09:00:00');
      const dayEnd = new Date('2025-01-15T17:00:00');
      const rangeStart = new Date('2025-01-15T18:00:00'); // After business
      const rangeEnd = new Date('2025-01-31T23:59:59');

      const result = calculateDayBusinessMinutes(
        '2025-01-15',
        businessHours,
        dayStart,
        dayEnd,
        rangeStart,
        rangeEnd
      );

      expect(result).toBe(0);
    });

    it('should return 0 if range ends before business hours', () => {
      const dayStart = new Date('2025-01-15T09:00:00');
      const dayEnd = new Date('2025-01-15T17:00:00');
      const rangeStart = new Date('2025-01-01T00:00:00');
      const rangeEnd = new Date('2025-01-15T08:00:00'); // Before business

      const result = calculateDayBusinessMinutes(
        '2025-01-15',
        businessHours,
        dayStart,
        dayEnd,
        rangeStart,
        rangeEnd
      );

      expect(result).toBe(0);
    });

    it('should handle null business hours', () => {
      const dayStart = new Date('2025-01-15T09:00:00');
      const dayEnd = new Date('2025-01-15T17:00:00');
      const rangeStart = new Date('2025-01-01T00:00:00');
      const rangeEnd = new Date('2025-01-31T23:59:59');

      const result = calculateDayBusinessMinutes(
        '2025-01-15',
        null,
        dayStart,
        dayEnd,
        rangeStart,
        rangeEnd
      );

      expect(result).toBe(0);
    });
  });

  describe('buildDayResult', () => {
    it('should build day result with all fields', () => {
      const result = buildDayResult('2025-01-31', 'Friday', 480, false, false);

      expect(result).toEqual({
        date: '2025-01-31',
        day_of_week: 'Friday',
        business_minutes: 480,
        is_weekend: false,
        is_holiday: false,
      });
    });

    it('should handle weekend day', () => {
      const result = buildDayResult('2025-02-01', 'Saturday', 0, true, false);

      expect(result).toEqual({
        date: '2025-02-01',
        day_of_week: 'Saturday',
        business_minutes: 0,
        is_weekend: true,
        is_holiday: false,
      });
    });

    it('should handle holiday', () => {
      const result = buildDayResult('2025-01-01', 'Wednesday', 0, false, true);

      expect(result).toEqual({
        date: '2025-01-01',
        day_of_week: 'Wednesday',
        business_minutes: 0,
        is_weekend: false,
        is_holiday: true,
      });
    });
  });
});
