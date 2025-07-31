import { describe, it, expect } from '@jest/globals';

import { YearlyRecurrence } from '../../../src/tools/recurrence/YearlyRecurrence';
import type { YearlyParams } from '../../../src/types/recurrence';

describe('YearlyRecurrence', () => {
  const recurrence = new YearlyRecurrence();

  describe('basic yearly recurrence (same date next year)', () => {
    it('should calculate next year for regular date', () => {
      const from = new Date('2024-06-15T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2025-06-15T10:00:00Z'));
    });

    it('should handle leap year Feb 29', () => {
      const from = new Date('2024-02-29T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
      };

      const result = recurrence.calculate(from, params);

      // Should map to Feb 28 in non-leap year
      expect(result).toEqual(new Date('2025-02-28T10:00:00Z'));
    });

    it('should preserve exact time', () => {
      const from = new Date('2024-06-15T14:30:45.123Z');
      const params: YearlyParams = {
        pattern: 'yearly',
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2025-06-15T14:30:45.123Z'));
    });

    it('should handle year-end dates', () => {
      const from = new Date('2024-12-31T23:59:59Z');
      const params: YearlyParams = {
        pattern: 'yearly',
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2025-12-31T23:59:59Z'));
    });
  });

  describe('with specific month/day', () => {
    it('should find next occurrence of specific date in future', () => {
      const from = new Date('2024-06-15T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
        month: 11, // December
        dayOfMonth: 25,
      };

      const result = recurrence.calculate(from, params);

      // Next Dec 25 is in same year
      expect(result).toEqual(new Date('2024-12-25T00:00:00Z'));
    });

    it('should advance to next year if date has passed', () => {
      const from = new Date('2024-06-15T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
        month: 0, // January
        dayOfMonth: 1,
      };

      const result = recurrence.calculate(from, params);

      // Jan 1 has passed, so next year
      expect(result).toEqual(new Date('2025-01-01T00:00:00Z'));
    });

    it('should handle Feb 29 in specific date mode', () => {
      const from = new Date('2024-06-15T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
        month: 1, // February
        dayOfMonth: 29,
      };

      const result = recurrence.calculate(from, params);

      // 2025 is not a leap year, so Feb 28
      expect(result).toEqual(new Date('2025-02-28T00:00:00Z'));
    });

    it('should handle current day being target day', () => {
      const from = new Date('2024-12-25T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
        month: 11, // December
        dayOfMonth: 25,
      };

      const result = recurrence.calculate(from, params);

      // Same day, so advance to next year
      expect(result).toEqual(new Date('2025-12-25T00:00:00Z'));
    });
  });

  describe('with time specification', () => {
    it('should set specific time for same-date pattern', () => {
      const from = new Date('2024-06-15T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
        time: '14:30',
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2025-06-15T14:30:00Z'));
    });

    it('should set specific time for specific-date pattern', () => {
      const from = new Date('2024-06-15T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
        month: 11,
        dayOfMonth: 25,
        time: '08:00',
      };

      const result = recurrence.calculate(from, params);

      expect(result).toEqual(new Date('2024-12-25T08:00:00Z'));
    });

    it('should check time when on same day', () => {
      const from = new Date('2024-12-25T15:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
        month: 11,
        dayOfMonth: 25,
        time: '14:00',
      };

      const result = recurrence.calculate(from, params);

      // Time has passed, advance to next year
      expect(result).toEqual(new Date('2025-12-25T14:00:00Z'));
    });
  });

  describe('with timezone', () => {
    it('should calculate in specified timezone for same-date pattern', () => {
      // June 15, 10am NY time
      const from = new Date('2024-06-15T14:00:00Z'); // 10am EDT
      const params: YearlyParams = {
        pattern: 'yearly',
        timezone: 'America/New_York',
      };

      const result = recurrence.calculate(from, params);

      // Next year, same wall-clock time
      expect(result).toEqual(new Date('2025-06-15T14:00:00Z')); // 10am EDT
    });

    it('should handle DST transitions', () => {
      // March 10, 2pm NY time (during DST)
      const from = new Date('2024-03-10T19:00:00Z'); // 2pm EST
      const params: YearlyParams = {
        pattern: 'yearly',
        time: '14:00',
        timezone: 'America/New_York',
      };

      const result = recurrence.calculate(from, params);

      // Next year, same wall-clock time (2pm EDT)
      expect(result).toEqual(new Date('2025-03-10T18:00:00Z')); // 2pm EDT
    });

    it('should find specific date in timezone', () => {
      // Sydney time
      const from = new Date('2024-06-15T00:00:00Z'); // June 15, 10am Sydney
      const params: YearlyParams = {
        pattern: 'yearly',
        month: 11,
        dayOfMonth: 31,
        timezone: 'Australia/Sydney',
      };

      const result = recurrence.calculate(from, params);

      // Dec 31 in Sydney (UTC+11 in December)
      expect(result).toEqual(new Date('2024-12-30T13:00:00Z')); // Dec 31 midnight Sydney
    });
  });

  describe('edge cases', () => {
    it('should handle leap year to leap year', () => {
      const from = new Date('2024-02-29T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
      };

      // Simulate 4 years ahead
      let result = from;
      for (let i = 0; i < 4; i++) {
        result = recurrence.calculate(result, params);
      }

      // When chaining yearly additions, Feb 29 becomes Feb 28 permanently
      expect(result).toEqual(new Date('2028-02-28T10:00:00Z'));
    });

    it('should handle month-end dates', () => {
      const from = new Date('2024-01-31T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
        month: 1, // February
        dayOfMonth: 31,
      };

      const result = recurrence.calculate(from, params);

      // Feb doesn't have 31 days, should use last day
      expect(result).toEqual(new Date('2024-02-29T00:00:00Z')); // 2024 is leap year
    });

    it('should handle -1 for last day of month', () => {
      const from = new Date('2024-06-15T10:00:00Z');
      const params: YearlyParams = {
        pattern: 'yearly',
        month: 1, // February
        dayOfMonth: -1,
      };

      const result = recurrence.calculate(from, params);

      // Last day of Feb 2025 (non-leap)
      expect(result).toEqual(new Date('2025-02-28T00:00:00Z'));
    });
  });
});
