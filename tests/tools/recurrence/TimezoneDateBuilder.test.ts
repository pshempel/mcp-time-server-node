import {
  setTimeInTimezone,
  addDaysInTimezone,
  isTimeInFuture,
} from '../../../src/tools/recurrence/TimezoneDateBuilder';

describe('TimezoneDateBuilder', () => {
  describe('setTimeInTimezone', () => {
    it('should set time in UTC when timezone is UTC', () => {
      const date = new Date('2025-01-15T10:30:00Z');

      const result = setTimeInTimezone(date, 14, 30, 'UTC');

      expect(result.toISOString()).toBe('2025-01-15T14:30:00.000Z');
      expect(result.getUTCHours()).toBe(14);
      expect(result.getUTCMinutes()).toBe(30);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);
    });

    it('should set time in UTC when timezone is empty string', () => {
      const date = new Date('2025-01-15T10:30:00Z');

      const result = setTimeInTimezone(date, 9, 15, '');

      expect(result.toISOString()).toBe('2025-01-15T09:15:00.000Z');
    });

    it('should set time in specified timezone', () => {
      const date = new Date('2025-01-15T10:30:00Z');

      // Set to 14:30 New York time
      const result = setTimeInTimezone(date, 14, 30, 'America/New_York');

      // 14:30 NY time in January (EST) is 19:30 UTC
      expect(result.toISOString()).toBe('2025-01-15T19:30:00.000Z');
    });

    it('should handle different timezone conversions', () => {
      const date = new Date('2025-01-15T10:30:00Z');

      // Tokyo is UTC+9
      const tokyoResult = setTimeInTimezone(date, 14, 30, 'Asia/Tokyo');

      // 14:30 Tokyo time is 05:30 UTC
      expect(tokyoResult.toISOString()).toBe('2025-01-15T05:30:00.000Z');

      // London in January is UTC+0
      const londonResult = setTimeInTimezone(date, 14, 30, 'Europe/London');

      expect(londonResult.toISOString()).toBe('2025-01-15T14:30:00.000Z');
    });

    it('should preserve the date when setting time', () => {
      const date = new Date('2025-01-20T23:59:59Z');

      // Set early morning time
      const result = setTimeInTimezone(date, 6, 0, 'UTC');

      // Should still be Jan 20
      expect(result.toISOString()).toBe('2025-01-20T06:00:00.000Z');
    });

    it('should handle midnight correctly', () => {
      const date = new Date('2025-01-15T15:00:00Z');

      const result = setTimeInTimezone(date, 0, 0, 'UTC');

      expect(result.toISOString()).toBe('2025-01-15T00:00:00.000Z');
    });

    it('should handle end of day correctly', () => {
      const date = new Date('2025-01-15T10:00:00Z');

      const result = setTimeInTimezone(date, 23, 59, 'UTC');

      expect(result.toISOString()).toBe('2025-01-15T23:59:00.000Z');
    });
  });

  describe('addDaysInTimezone', () => {
    it('should add days preserving time in UTC', () => {
      const date = new Date('2025-01-15T14:30:00Z');

      const result = addDaysInTimezone(date, 3, 'UTC');

      expect(result.toISOString()).toBe('2025-01-18T14:30:00.000Z');
    });

    it('should add days preserving time in timezone', () => {
      // Start with a UTC time that represents 9:00 AM NY time
      const date = new Date('2025-01-15T14:00:00Z'); // 9:00 AM EST

      const result = addDaysInTimezone(date, 1, 'America/New_York');

      // Should still be 9:00 AM NY time next day (14:00 UTC)
      expect(result.toISOString()).toBe('2025-01-16T14:00:00.000Z');
    });

    it('should handle DST transitions when adding days', () => {
      // Day before DST starts in US (March 9, 2025)
      // 9:00 AM EST = 14:00 UTC
      const beforeDST = new Date('2025-03-08T14:00:00Z');

      const result = addDaysInTimezone(beforeDST, 2, 'America/New_York');

      // After DST, 9:00 AM EDT = 13:00 UTC (1 hour earlier)
      expect(result.toISOString()).toBe('2025-03-10T13:00:00.000Z');
    });
  });

  describe('isTimeInFuture', () => {
    it('should return true when time is in future', () => {
      const now = new Date('2025-01-15T10:30:00Z');
      const future = new Date('2025-01-15T14:30:00Z');

      const result = isTimeInFuture(future, now);

      expect(result).toBe(true);
    });

    it('should return false when time is in past', () => {
      const now = new Date('2025-01-15T10:30:00Z');
      const past = new Date('2025-01-15T09:30:00Z');

      const result = isTimeInFuture(past, now);

      expect(result).toBe(false);
    });

    it('should return false when times are equal', () => {
      const now = new Date('2025-01-15T10:30:00Z');
      const same = new Date('2025-01-15T10:30:00Z');

      const result = isTimeInFuture(same, now);

      expect(result).toBe(false);
    });
  });
});
