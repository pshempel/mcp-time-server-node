import { describe, it, expect } from '@jest/globals';

import { MonthlyRecurrence } from '../../../src/tools/recurrence/MonthlyRecurrence';
import type { MonthlyParams } from '../../../src/types/recurrence';

describe('MonthlyRecurrence', () => {
  const recurrence = new MonthlyRecurrence();

  describe('basic monthly recurrence', () => {
    it('should calculate next month for mid-month dates', () => {
      const from = new Date('2024-01-15T10:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 15,
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2024-02-15T00:00:00Z'));
    });

    it('should handle month-end overflow (31st to Feb)', () => {
      const from = new Date('2024-01-31T10:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 31,
      };

      const result = recurrence.calculate(from, params);

      // Should map to last day of February (29th in leap year)
      expect(result).toEqual(new Date('2024-02-29T00:00:00Z'));
    });

    it('should handle month-end overflow (31st to April)', () => {
      const from = new Date('2024-03-31T10:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 31,
      };

      const result = recurrence.calculate(from, params);

      // Should map to last day of April (30th)
      expect(result).toEqual(new Date('2024-04-30T00:00:00Z'));
    });

    it('should handle non-leap year February', () => {
      const from = new Date('2025-01-31T10:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 31,
      };

      const result = recurrence.calculate(from, params);

      // Should map to Feb 28 in non-leap year
      expect(result).toEqual(new Date('2025-02-28T00:00:00Z'));
    });
  });

  describe('with time specification', () => {
    it('should set specific time on target day', () => {
      const from = new Date('2024-01-15T10:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 20,
        time: '14:30',
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2024-01-20T14:30:00Z'));
    });

    it('should advance to next month if target datetime has passed', () => {
      const from = new Date('2024-01-20T15:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 20,
        time: '14:30',
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2024-02-20T14:30:00Z'));
    });
  });

  describe('with timezone', () => {
    it('should calculate in specified timezone', () => {
      // From Jan 15, 3pm NY time
      const from = new Date('2024-01-15T20:00:00Z'); // 3pm EST
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 20,
        time: '14:30',
        timezone: 'America/New_York',
      };

      const result = recurrence.calculate(from, params);

      // Jan 20, 2:30pm NY time = 19:30 UTC (EST)
      expect(result).toEqual(new Date('2024-01-20T19:30:00Z'));
    });

    it('should handle DST transitions correctly', () => {
      // From Feb 15, looking for March 15 (crosses DST boundary)
      const from = new Date('2024-02-15T20:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 15,
        time: '14:30',
        timezone: 'America/New_York',
      };

      const result = recurrence.calculate(from, params);

      // Mar 15, 2:30pm NY time = 18:30 UTC (EDT, not EST)
      expect(result).toEqual(new Date('2024-03-15T18:30:00Z'));
    });

    it('should handle month-end in timezone context', () => {
      // Sydney time, Jan 31
      const from = new Date('2024-01-30T13:00:00Z'); // Jan 31, midnight Sydney
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 31,
        timezone: 'Australia/Sydney',
      };

      const result = recurrence.calculate(from, params);

      // Feb 29 in Sydney (leap year)
      expect(result).toEqual(new Date('2024-02-28T13:00:00Z')); // Feb 29, midnight Sydney
    });
  });

  describe('edge cases', () => {
    it('should handle current day being target day', () => {
      const from = new Date('2024-01-15T10:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 15,
      };

      const result = recurrence.calculate(from, params);

      // Should advance to next month since we're already on the 15th
      expect(result).toEqual(new Date('2024-02-15T00:00:00Z'));
    });

    it('should handle last day of month request', () => {
      const from = new Date('2024-01-15T10:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: -1, // Special value for last day
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2024-01-31T00:00:00Z'));
    });

    it('should handle year boundary', () => {
      const from = new Date('2024-12-15T10:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 20,
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2024-12-20T00:00:00Z'));
    });

    it('should advance to next year if needed', () => {
      const from = new Date('2024-12-20T10:00:00Z');
      const params: MonthlyParams = {
        pattern: 'monthly',
        dayOfMonth: 20,
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2025-01-20T00:00:00Z'));
    });
  });
});
