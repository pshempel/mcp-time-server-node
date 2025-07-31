import { WeeklyRecurrence } from '../../../src/tools/recurrence/WeeklyRecurrence';
import type { WeeklyParams } from '../../../src/types/recurrence';

describe('WeeklyRecurrence', () => {
  let weekly: WeeklyRecurrence;

  beforeEach(() => {
    weekly = new WeeklyRecurrence();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('calculate', () => {
    it('should return next week same day when no day specified', () => {
      // Wednesday Jan 15, 2025
      const from = new Date('2025-01-15T10:30:00Z');
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'UTC',
      };

      const result = weekly.calculate(from, params);

      // Next Wednesday
      expect(result.toISOString()).toBe('2025-01-22T10:30:00.000Z');
    });

    it('should return next occurrence of specified weekday', () => {
      // Wednesday Jan 15, 2025
      const from = new Date('2025-01-15T10:30:00Z');
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'UTC',
        dayOfWeek: 5, // Friday
      };

      const result = weekly.calculate(from, params);

      // This Friday
      expect(result.toISOString()).toBe('2025-01-17T10:30:00.000Z');
    });

    it('should handle Sunday (0) correctly', () => {
      const from = new Date('2025-01-15T10:30:00Z'); // Wednesday
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'UTC',
        dayOfWeek: 0, // Sunday
      };

      const result = weekly.calculate(from, params);

      // This Sunday
      expect(result.toISOString()).toBe('2025-01-19T10:30:00.000Z');
    });

    it('should handle Saturday (6) correctly', () => {
      const from = new Date('2025-01-15T10:30:00Z'); // Wednesday
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'UTC',
        dayOfWeek: 6, // Saturday
      };

      const result = weekly.calculate(from, params);

      // This Saturday
      expect(result.toISOString()).toBe('2025-01-18T10:30:00.000Z');
    });

    it('should return today if same weekday and time has not passed', () => {
      const from = new Date('2025-01-15T10:30:00Z'); // Wednesday
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'UTC',
        dayOfWeek: 3, // Wednesday
        time: '14:30',
      };

      const result = weekly.calculate(from, params);

      // Today at 14:30
      expect(result.toISOString()).toBe('2025-01-15T14:30:00.000Z');
    });

    it('should return next week if same weekday but time has passed', () => {
      const from = new Date('2025-01-15T10:30:00Z'); // Wednesday
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'UTC',
        dayOfWeek: 3, // Wednesday
        time: '09:00', // Already passed
      };

      const result = weekly.calculate(from, params);

      // Next Wednesday at 9:00
      expect(result.toISOString()).toBe('2025-01-22T09:00:00.000Z');
    });

    it('should handle timezone correctly', () => {
      const from = new Date('2025-01-15T10:30:00Z'); // Wednesday 5:30 AM NY
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'America/New_York',
        dayOfWeek: 5, // Friday
        time: '09:00', // 9 AM NY time
      };

      const result = weekly.calculate(from, params);

      // Friday 9 AM NY = 14:00 UTC (EST)
      expect(result.toISOString()).toBe('2025-01-17T14:00:00.000Z');
    });

    it('should handle timezone when calculating day of week', () => {
      // UTC: Wednesday Jan 15 at 2 AM
      // NY: Tuesday Jan 14 at 9 PM
      const from = new Date('2025-01-15T02:00:00Z');
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'America/New_York',
        dayOfWeek: 2, // Tuesday
        time: '22:00', // 10 PM NY
      };

      const result = weekly.calculate(from, params);

      // We're at Tuesday 9 PM NY, want Tuesday 10 PM NY
      // That's just 1 hour later - today!
      // Tuesday 10 PM NY = Wednesday 3 AM UTC
      expect(result.toISOString()).toBe('2025-01-15T03:00:00.000Z');
    });

    it('should handle wrapping around to next week', () => {
      const from = new Date('2025-01-18T10:30:00Z'); // Saturday
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'UTC',
        dayOfWeek: 1, // Monday
      };

      const result = weekly.calculate(from, params);

      // Next Monday
      expect(result.toISOString()).toBe('2025-01-20T10:30:00.000Z');
    });

    it('should preserve seconds and milliseconds as 0 with time', () => {
      const from = new Date('2025-01-15T10:30:45.123Z');
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'UTC',
        dayOfWeek: 5,
        time: '14:30',
      };

      const result = weekly.calculate(from, params);

      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should handle same day without specific time', () => {
      const from = new Date('2025-01-15T10:30:00Z'); // Wednesday
      const params: WeeklyParams = {
        pattern: 'weekly',
        timezone: 'UTC',
        dayOfWeek: 3, // Wednesday, no time specified
      };

      const result = weekly.calculate(from, params);

      // Should be next Wednesday (force next week when no time)
      expect(result.toISOString()).toBe('2025-01-22T10:30:00.000Z');
    });
  });
});
