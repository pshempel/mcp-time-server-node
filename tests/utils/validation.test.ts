import {
  validateTimezone,
  validateDateFormat,
  validateTimeUnit,
  validateRecurrencePattern,
  validateDayOfWeek,
  validateDayOfMonth,
  createError,
} from '../../src/utils/validation';
import { TimeServerErrorCodes } from '../../src/types';

describe('Validation Utilities', () => {
  describe('validateTimezone', () => {
    it('should return true for valid IANA timezones', () => {
      expect(validateTimezone('UTC')).toBe(true);
      expect(validateTimezone('America/New_York')).toBe(true);
      expect(validateTimezone('Europe/London')).toBe(true);
      expect(validateTimezone('Asia/Tokyo')).toBe(true);
      expect(validateTimezone('EST')).toBe(true); // Legacy but valid
      expect(validateTimezone('EST5EDT')).toBe(true); // Legacy but valid
    });

    it('should return false for invalid timezones', () => {
      expect(validateTimezone('Invalid/Zone')).toBe(false);
      expect(validateTimezone('NotATimezone')).toBe(false);
    });

    it('should return false for empty/null/undefined', () => {
      expect(validateTimezone('')).toBe(false);
      expect(validateTimezone(undefined)).toBe(false);
      expect(validateTimezone(null as any)).toBe(false);
    });

    it('should default empty string to UTC (special case)', () => {
      // Based on verified behavior: empty string defaults to UTC
      // This is a design decision we need to make
      expect(validateTimezone('', true)).toBe(true); // allowEmpty flag
    });
  });

  describe('validateDateFormat', () => {
    it('should validate ISO 8601 formats', () => {
      expect(validateDateFormat('2024-01-01')).toBe(true);
      expect(validateDateFormat('2024-01-01T12:00:00Z')).toBe(true);
      expect(validateDateFormat('2024-01-01T12:00:00+05:30')).toBe(true);
      expect(validateDateFormat('2024-01-01T12:00:00.123Z')).toBe(true);
    });

    it('should validate Unix timestamps', () => {
      expect(validateDateFormat(1704110400)).toBe(true);
      expect(validateDateFormat('1704110400')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateDateFormat('not-a-date')).toBe(false);
      expect(validateDateFormat('2024-13-01')).toBe(false); // Invalid month
      expect(validateDateFormat('2024-01-32')).toBe(false); // Invalid day
      expect(validateDateFormat('')).toBe(false);
      expect(validateDateFormat('Mon, 01 Jan 2024 12:00:00 GMT')).toBe(false); // RFC2822 not supported by parseISO
    });

    it('should handle null/undefined', () => {
      expect(validateDateFormat(undefined)).toBe(false);
      expect(validateDateFormat(null as any)).toBe(false);
    });
  });

  describe('validateTimeUnit', () => {
    it('should validate all valid time units', () => {
      const validUnits = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
      validUnits.forEach((unit) => {
        expect(validateTimeUnit(unit)).toBe(true);
      });
    });

    it('should reject invalid units', () => {
      expect(validateTimeUnit('week')).toBe(false);
      expect(validateTimeUnit('milliseconds')).toBe(false);
      expect(validateTimeUnit('century')).toBe(false);
      expect(validateTimeUnit('')).toBe(false);
      expect(validateTimeUnit('day')).toBe(false); // Singular not accepted
    });
  });

  describe('validateRecurrencePattern', () => {
    it('should validate all valid patterns', () => {
      const validPatterns = ['daily', 'weekly', 'monthly', 'yearly'];
      validPatterns.forEach((pattern) => {
        expect(validateRecurrencePattern(pattern)).toBe(true);
      });
    });

    it('should reject invalid patterns', () => {
      expect(validateRecurrencePattern('hourly')).toBe(false);
      expect(validateRecurrencePattern('biweekly')).toBe(false);
      expect(validateRecurrencePattern('quarterly')).toBe(false);
      expect(validateRecurrencePattern('')).toBe(false);
    });
  });

  describe('validateDayOfWeek', () => {
    it('should validate days 0-6', () => {
      for (let i = 0; i <= 6; i++) {
        expect(validateDayOfWeek(i)).toBe(true);
      }
    });

    it('should reject invalid days', () => {
      expect(validateDayOfWeek(-1)).toBe(false);
      expect(validateDayOfWeek(7)).toBe(false);
      expect(validateDayOfWeek(10)).toBe(false);
      expect(validateDayOfWeek(1.5)).toBe(false);
      expect(validateDayOfWeek(NaN)).toBe(false);
    });
  });

  describe('validateDayOfMonth', () => {
    it('should validate days 1-31', () => {
      expect(validateDayOfMonth(1)).toBe(true);
      expect(validateDayOfMonth(15)).toBe(true);
      expect(validateDayOfMonth(31)).toBe(true);
    });

    it('should reject invalid days', () => {
      expect(validateDayOfMonth(0)).toBe(false);
      expect(validateDayOfMonth(32)).toBe(false);
      expect(validateDayOfMonth(-5)).toBe(false);
      expect(validateDayOfMonth(15.5)).toBe(false);
      expect(validateDayOfMonth(NaN)).toBe(false);
    });
  });

  describe('createError', () => {
    it('should create error with all fields', () => {
      const error = createError(
        TimeServerErrorCodes.INVALID_TIMEZONE,
        'Invalid timezone provided',
        { timezone: 'Invalid/Zone' },
      );

      expect(error).toEqual({
        code: TimeServerErrorCodes.INVALID_TIMEZONE,
        message: 'Invalid timezone provided',
        details: { timezone: 'Invalid/Zone' },
      });
    });

    it('should create error without details', () => {
      const error = createError(TimeServerErrorCodes.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded');

      expect(error).toEqual({
        code: TimeServerErrorCodes.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded',
      });
    });
  });
});
