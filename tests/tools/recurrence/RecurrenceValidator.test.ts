import { describe, it, expect } from '@jest/globals';

import { RecurrenceValidator } from '../../../src/tools/recurrence/RecurrenceValidator';
import type {
  DailyParams,
  WeeklyParams,
  MonthlyParams,
  YearlyParams,
} from '../../../src/types/recurrence';

describe('RecurrenceValidator', () => {
  const validator = new RecurrenceValidator();

  describe('pattern validation', () => {
    it('should accept valid patterns', () => {
      // Test each pattern with minimal valid params
      expect(() => validator.validate({ pattern: 'daily' })).not.toThrow();
      expect(() => validator.validate({ pattern: 'weekly' })).not.toThrow();
      expect(() => validator.validate({ pattern: 'monthly', dayOfMonth: 15 })).not.toThrow();
      expect(() => validator.validate({ pattern: 'yearly' })).not.toThrow();
    });

    it('should reject invalid patterns', () => {
      const invalidPatterns = ['hourly', 'invalid', 'DAILY'];
      invalidPatterns.forEach((pattern) => {
        expect(() => validator.validate({ pattern } as any)).toThrow(
          expect.objectContaining({
            error: expect.objectContaining({
              code: 'INVALID_PARAMETER',
              message: expect.stringContaining('Invalid pattern'),
            }),
          }),
        );
      });
    });

    it('should reject missing pattern', () => {
      expect(() => validator.validate({} as any)).toThrow(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_PARAMETER',
            message: expect.stringContaining('Pattern is required'),
          }),
        }),
      );
    });
  });

  describe('timezone validation', () => {
    it('should accept undefined timezone (system default)', () => {
      const params: DailyParams = { pattern: 'daily' };
      expect(() => validator.validate(params)).not.toThrow();
    });

    it('should accept empty string timezone (UTC)', () => {
      const params: DailyParams = { pattern: 'daily', timezone: '' };
      expect(() => validator.validate(params)).not.toThrow();
    });

    it('should accept valid timezones', () => {
      const validTimezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
      validTimezones.forEach((timezone) => {
        const params: DailyParams = { pattern: 'daily', timezone };
        expect(() => validator.validate(params)).not.toThrow();
      });
    });

    it('should reject invalid timezones', () => {
      const params: DailyParams = { pattern: 'daily', timezone: 'Invalid/Zone' };
      expect(() => validator.validate(params)).toThrow(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TIMEZONE',
            message: expect.stringContaining('Invalid timezone'),
          }),
        }),
      );
    });
  });

  describe('time validation', () => {
    it('should accept valid time formats', () => {
      const validTimes = ['00:00', '14:30', '23:59', '9:45'];
      validTimes.forEach((time) => {
        const params: DailyParams = { pattern: 'daily', time };
        expect(() => validator.validate(params)).not.toThrow();
      });
    });

    it('should accept undefined time', () => {
      const params: DailyParams = { pattern: 'daily' };
      expect(() => validator.validate(params)).not.toThrow();
    });

    it('should reject invalid time formats', () => {
      const invalidTimes = ['24:00', '12:60', '14:30:00', '14', '14:3', 'invalid'];
      invalidTimes.forEach((time) => {
        const params: DailyParams = { pattern: 'daily', time };
        expect(() => validator.validate(params)).toThrow(
          expect.objectContaining({
            error: expect.objectContaining({
              code: 'INVALID_PARAMETER',
              message: expect.stringContaining('Invalid time format'),
            }),
          }),
        );
      });
    });
  });

  describe('weekly pattern validation', () => {
    it('should accept valid day of week', () => {
      const validDays = [0, 1, 2, 3, 4, 5, 6];
      validDays.forEach((dayOfWeek) => {
        const params: WeeklyParams = { pattern: 'weekly', dayOfWeek };
        expect(() => validator.validate(params)).not.toThrow();
      });
    });

    it('should accept undefined day of week', () => {
      const params: WeeklyParams = { pattern: 'weekly' };
      expect(() => validator.validate(params)).not.toThrow();
    });

    it('should reject invalid day of week', () => {
      const invalidDays = [-1, 7, 0.5, NaN];
      invalidDays.forEach((dayOfWeek) => {
        const params: WeeklyParams = { pattern: 'weekly', dayOfWeek };
        expect(() => validator.validate(params)).toThrow(
          expect.objectContaining({
            error: expect.objectContaining({
              code: 'INVALID_PARAMETER',
              message: expect.stringContaining('Invalid day of week'),
            }),
          }),
        );
      });
    });
  });

  describe('monthly pattern validation', () => {
    it('should accept valid day of month', () => {
      const validDays = [1, 15, 28, 31, -1]; // -1 is special for last day
      validDays.forEach((dayOfMonth) => {
        const params: MonthlyParams = { pattern: 'monthly', dayOfMonth };
        expect(() => validator.validate(params)).not.toThrow();
      });
    });

    it('should reject missing day of month', () => {
      const params = { pattern: 'monthly' } as MonthlyParams;
      expect(() => validator.validate(params)).toThrow(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_PARAMETER',
            message: expect.stringContaining('dayOfMonth is required'),
          }),
        }),
      );
    });

    it('should reject invalid day of month', () => {
      const invalidDays = [-2, 0, 32, 1.5, NaN];
      invalidDays.forEach((dayOfMonth) => {
        const params: MonthlyParams = { pattern: 'monthly', dayOfMonth };
        expect(() => validator.validate(params)).toThrow(
          expect.objectContaining({
            error: expect.objectContaining({
              code: 'INVALID_PARAMETER',
              message: expect.stringContaining('Invalid day of month'),
            }),
          }),
        );
      });
    });
  });

  describe('yearly pattern validation', () => {
    it('should accept undefined month and dayOfMonth', () => {
      const params: YearlyParams = { pattern: 'yearly' };
      expect(() => validator.validate(params)).not.toThrow();
    });

    it('should accept valid month', () => {
      const validMonths = [0, 1, 5, 11];
      validMonths.forEach((month) => {
        const params: YearlyParams = { pattern: 'yearly', month, dayOfMonth: 15 };
        expect(() => validator.validate(params)).not.toThrow();
      });
    });

    it('should reject invalid month', () => {
      const invalidMonths = [-1, 12, 0.5, NaN];
      invalidMonths.forEach((month) => {
        const params: YearlyParams = { pattern: 'yearly', month, dayOfMonth: 15 };
        expect(() => validator.validate(params)).toThrow(
          expect.objectContaining({
            error: expect.objectContaining({
              code: 'INVALID_PARAMETER',
              message: expect.stringContaining('Invalid month'),
            }),
          }),
        );
      });
    });

    it('should reject month without dayOfMonth', () => {
      const params: YearlyParams = { pattern: 'yearly', month: 5 };
      expect(() => validator.validate(params)).toThrow(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_PARAMETER',
            message: expect.stringContaining('Both month and dayOfMonth'),
          }),
        }),
      );
    });

    it('should reject dayOfMonth without month', () => {
      const params: YearlyParams = { pattern: 'yearly', dayOfMonth: 15 };
      expect(() => validator.validate(params)).toThrow(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_PARAMETER',
            message: expect.stringContaining('Both month and dayOfMonth'),
          }),
        }),
      );
    });
  });

  describe('string length validation', () => {
    it('should reject excessively long timezone strings', () => {
      const params: DailyParams = {
        pattern: 'daily',
        timezone: 'A'.repeat(101), // Over 100 char limit
      };
      expect(() => validator.validate(params)).toThrow(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_PARAMETER',
            message: expect.stringContaining('exceeds maximum length'),
          }),
        }),
      );
    });

    it('should accept timezone at max length', () => {
      const params: DailyParams = {
        pattern: 'daily',
        timezone: 'A'.repeat(100), // At 100 char limit
      };
      // Will fail timezone validation but not length validation
      expect(() => validator.validate(params)).toThrow(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TIMEZONE', // Not length error
          }),
        }),
      );
    });
  });
});
