import { DailyRecurrence } from '../../../src/tools/recurrence/DailyRecurrence';
import type { DailyParams } from '../../../src/types/recurrence';

describe('DailyRecurrence', () => {
  let daily: DailyRecurrence;

  beforeEach(() => {
    daily = new DailyRecurrence();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('calculate', () => {
    it('should return next day at same time when no specific time given', () => {
      const from = new Date('2025-01-15T10:30:00Z');
      const params: DailyParams = { pattern: 'daily', timezone: 'UTC' };

      const result = daily.calculate(from, params);

      expect(result.toISOString()).toBe('2025-01-16T10:30:00.000Z');
    });

    it('should return today at specified time if time has not passed', () => {
      const from = new Date('2025-01-15T10:30:00Z');
      const params: DailyParams = {
        pattern: 'daily',
        timezone: 'UTC',
        time: '14:30',
      };

      const result = daily.calculate(from, params);

      expect(result.toISOString()).toBe('2025-01-15T14:30:00.000Z');
    });

    it('should return tomorrow at specified time if time has passed', () => {
      const from = new Date('2025-01-15T10:30:00Z');
      const params: DailyParams = {
        pattern: 'daily',
        timezone: 'UTC',
        time: '09:00',
      };

      const result = daily.calculate(from, params);

      expect(result.toISOString()).toBe('2025-01-16T09:00:00.000Z');
    });

    it('should handle timezone correctly when calculating next occurrence', () => {
      const from = new Date('2025-01-15T10:30:00Z'); // 5:30 AM NY time
      const params: DailyParams = {
        pattern: 'daily',
        timezone: 'America/New_York',
        time: '14:30', // 2:30 PM NY time
      };

      const result = daily.calculate(from, params);

      // 14:30 NY time is 19:30 UTC (EST)
      expect(result.toISOString()).toBe('2025-01-15T19:30:00.000Z');
    });

    it('should handle timezone when time has passed', () => {
      const from = new Date('2025-01-15T15:00:00Z'); // 10:00 AM NY time
      const params: DailyParams = {
        pattern: 'daily',
        timezone: 'America/New_York',
        time: '09:00', // 9:00 AM NY time (already passed)
      };

      const result = daily.calculate(from, params);

      // Tomorrow 9:00 AM NY time is 14:00 UTC
      expect(result.toISOString()).toBe('2025-01-16T14:00:00.000Z');
    });

    it('should work with empty string as UTC timezone', () => {
      const from = new Date('2025-01-15T10:30:00Z');
      const params: DailyParams = {
        pattern: 'daily',
        timezone: '',
        time: '14:00',
      };

      const result = daily.calculate(from, params);

      expect(result.toISOString()).toBe('2025-01-15T14:00:00.000Z');
    });

    it('should handle exact same time as current (edge case)', () => {
      const from = new Date('2025-01-15T10:30:00Z');
      const params: DailyParams = {
        pattern: 'daily',
        timezone: 'UTC',
        time: '10:30',
      };

      const result = daily.calculate(from, params);

      // Should be tomorrow since we're at exact same time
      expect(result.toISOString()).toBe('2025-01-16T10:30:00.000Z');
    });

    it('should preserve seconds and milliseconds as 0', () => {
      const from = new Date('2025-01-15T10:30:45.123Z');
      const params: DailyParams = {
        pattern: 'daily',
        timezone: 'UTC',
        time: '14:30',
      };

      const result = daily.calculate(from, params);

      expect(result.toISOString()).toBe('2025-01-15T14:30:00.000Z');
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });
});
