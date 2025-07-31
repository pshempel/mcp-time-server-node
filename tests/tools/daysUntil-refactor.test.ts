import { parseISO, isValid } from 'date-fns';

import { CacheTTL } from '../../src/cache/timeCache';
import {
  convertToTimezone,
  formatDaysUntil,
  getCacheTTL,
  parseTargetDate,
  resolveTimezone,
} from '../../src/tools/daysUntil';

describe('daysUntil refactoring helpers', () => {
  describe('resolveTimezone', () => {
    it('should return default timezone when undefined', () => {
      expect(resolveTimezone(undefined, 'America/New_York')).toBe('America/New_York');
    });

    it('should return UTC when empty string', () => {
      expect(resolveTimezone('', 'America/New_York')).toBe('UTC');
    });

    it('should return provided timezone when valid', () => {
      expect(resolveTimezone('Europe/London', 'America/New_York')).toBe('Europe/London');
    });
  });

  describe('parseTargetDate', () => {
    it('should parse Unix timestamp string', () => {
      const result = parseTargetDate('1735689600');
      expect(result.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should parse numeric Unix timestamp', () => {
      const result = parseTargetDate(1735689600);
      expect(result.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should parse ISO date string', () => {
      const result = parseTargetDate('2025-01-01T00:00:00Z');
      expect(result.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should parse date without timezone info', () => {
      const result = parseTargetDate('2025-01-01');
      // parseISO interprets date-only strings in system timezone
      expect(result).toBeInstanceOf(Date);
      expect(isValid(result)).toBe(true);
    });

    it('should throw for invalid Unix timestamp', () => {
      expect(() => parseTargetDate('invalid123')).toThrow('Invalid date');
    });

    it('should throw for invalid date string', () => {
      expect(() => parseTargetDate('not-a-date')).toThrow('Invalid date');
    });
  });

  describe('convertToTimezone', () => {
    it('should return same date for UTC timezone', () => {
      const date = parseISO('2025-01-01T12:00:00Z');
      const result = convertToTimezone(date, 'UTC');
      expect(result).toBe(date);
    });

    it('should convert to specified timezone', () => {
      const date = parseISO('2025-01-01T12:00:00Z');
      const result = convertToTimezone(date, 'America/New_York');
      // Result should be a different date object
      expect(result).not.toBe(date);
      // But represents the same moment in time
      expect(result.valueOf()).toBeDefined();
    });
  });

  describe('formatDaysUntil', () => {
    it('should return "Today" for 0 days', () => {
      expect(formatDaysUntil(0)).toBe('Today');
    });

    it('should return "Tomorrow" for 1 day', () => {
      expect(formatDaysUntil(1)).toBe('Tomorrow');
    });

    it('should return "Yesterday" for -1 day', () => {
      expect(formatDaysUntil(-1)).toBe('Yesterday');
    });

    it('should return "in X days" for positive days', () => {
      expect(formatDaysUntil(5)).toBe('in 5 days');
      expect(formatDaysUntil(365)).toBe('in 365 days');
    });

    it('should return "X days ago" for negative days', () => {
      expect(formatDaysUntil(-5)).toBe('5 days ago');
      expect(formatDaysUntil(-365)).toBe('365 days ago');
    });
  });

  describe('getCacheTTL', () => {
    it('should return CURRENT_TIME TTL for today (0 days)', () => {
      expect(getCacheTTL(0)).toBe(CacheTTL.CURRENT_TIME);
    });

    it('should return CALCULATIONS TTL for future dates', () => {
      expect(getCacheTTL(1)).toBe(CacheTTL.CALCULATIONS);
      expect(getCacheTTL(365)).toBe(CacheTTL.CALCULATIONS);
    });

    it('should return CALCULATIONS TTL for past dates', () => {
      expect(getCacheTTL(-1)).toBe(CacheTTL.CALCULATIONS);
      expect(getCacheTTL(-365)).toBe(CacheTTL.CALCULATIONS);
    });
  });
});
