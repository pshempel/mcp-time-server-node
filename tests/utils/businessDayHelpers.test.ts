import { parseISO } from 'date-fns';

import { ValidationError } from '../../src/adapters/mcp-sdk';
import {
  validateHolidayCalendar,
  validateDateRange,
  categorizeDays,
  adjustForWeekends,
  type DayCategories,
} from '../../src/utils/businessDayHelpers';

describe('businessDayHelpers', () => {
  describe('validateHolidayCalendar', () => {
    it('should accept valid 2-letter country codes', () => {
      expect(() => validateHolidayCalendar('US')).not.toThrow();
      expect(() => validateHolidayCalendar('UK')).not.toThrow();
      expect(() => validateHolidayCalendar('CA')).not.toThrow();
    });

    it('should accept valid 3-letter country codes', () => {
      expect(() => validateHolidayCalendar('USA')).not.toThrow();
      expect(() => validateHolidayCalendar('GBR')).not.toThrow();
    });

    it('should reject codes with null bytes', () => {
      expect(() => validateHolidayCalendar('US\0')).toThrow(ValidationError);
      expect(() => validateHolidayCalendar('\x00US')).toThrow(ValidationError);
    });

    it('should reject invalid formats', () => {
      expect(() => validateHolidayCalendar('us')).toThrow(ValidationError);
      expect(() => validateHolidayCalendar('U')).toThrow(ValidationError);
      expect(() => validateHolidayCalendar('USAA')).toThrow(ValidationError);
      expect(() => validateHolidayCalendar('123')).toThrow(ValidationError);
    });

    it('should include proper error details', () => {
      try {
        validateHolidayCalendar('invalid');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('2-3 letter country code');
      }
    });
  });

  describe('validateDateRange', () => {
    it('should accept valid date ranges', () => {
      const start = parseISO('2025-01-01');
      const end = parseISO('2025-12-31');
      expect(() => validateDateRange(start, end, '2025-01-01', '2025-12-31')).not.toThrow();
    });

    it('should accept ranges up to 100 years', () => {
      const start = parseISO('2025-01-01');
      const end = parseISO('2124-12-31');
      expect(() => validateDateRange(start, end, '2025-01-01', '2124-12-31')).not.toThrow();
    });

    it('should reject ranges over 100 years', () => {
      const start = parseISO('2025-01-01');
      const end = parseISO('2126-01-01');
      expect(() => validateDateRange(start, end, '2025-01-01', '2126-01-01')).toThrow(
        ValidationError
      );
    });

    it('should include proper error details', () => {
      const start = parseISO('2025-01-01');
      const end = parseISO('2200-01-01');
      try {
        validateDateRange(start, end, '2025-01-01', '2200-01-01');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const err = error as ValidationError;
        expect(err.message).toContain('100 years');
        expect((err.details as any)?.max_days).toBe(36500);
      }
    });
  });

  describe('categorizeDays', () => {
    it('should categorize weekdays correctly', () => {
      // Monday to Friday (Jan 6-10, 2025) - Use parseISO for consistency
      const days = [
        parseISO('2025-01-06'),
        parseISO('2025-01-07'),
        parseISO('2025-01-08'),
        parseISO('2025-01-09'),
        parseISO('2025-01-10'),
      ];
      const holidays = new Set<string>();

      const result = categorizeDays(days, holidays);

      expect(result.businessDays).toBe(5);
      expect(result.weekendDays).toBe(0);
      expect(result.holidayCount).toBe(0);
    });

    it('should categorize weekends correctly', () => {
      // Saturday and Sunday (Jan 11-12, 2025) - Use parseISO
      const days = [parseISO('2025-01-11'), parseISO('2025-01-12')];
      const holidays = new Set<string>();

      const result = categorizeDays(days, holidays);

      expect(result.businessDays).toBe(0);
      expect(result.weekendDays).toBe(2);
      expect(result.holidayCount).toBe(0);
    });

    it('should categorize holidays correctly', () => {
      // Christmas (Thursday) and New Year's (Wednesday) - Use parseISO
      const days = [parseISO('2025-12-25'), parseISO('2025-01-01')];
      const holidays = new Set<string>([
        parseISO('2025-12-25').toDateString(),
        parseISO('2025-01-01').toDateString(),
      ]);

      const result = categorizeDays(days, holidays);

      expect(result.businessDays).toBe(0);
      expect(result.weekendDays).toBe(0);
      expect(result.holidayCount).toBe(2);
    });

    it('should handle mixed day types', () => {
      // Week including weekend and holiday - Use parseISO
      const days = [
        parseISO('2025-01-01'), // Wed - Holiday
        parseISO('2025-01-02'), // Thu - Business
        parseISO('2025-01-03'), // Fri - Business
        parseISO('2025-01-04'), // Sat - Weekend
        parseISO('2025-01-05'), // Sun - Weekend
      ];
      const holidays = new Set<string>([parseISO('2025-01-01').toDateString()]);

      const result = categorizeDays(days, holidays);

      expect(result.businessDays).toBe(2);
      expect(result.weekendDays).toBe(2);
      expect(result.holidayCount).toBe(1);
    });
  });

  describe('adjustForWeekends', () => {
    it('should not change counts when excluding weekends', () => {
      const categories: DayCategories = {
        businessDays: 10,
        weekendDays: 4,
        holidayCount: 1,
      };

      const result = adjustForWeekends(categories, true);

      expect(result.businessDays).toBe(10);
      expect(result.weekendDays).toBe(4);
      expect(result.holidayCount).toBe(1);
    });

    it('should add weekends to business days when including weekends', () => {
      const categories: DayCategories = {
        businessDays: 10,
        weekendDays: 4,
        holidayCount: 1,
      };

      const result = adjustForWeekends(categories, false);

      expect(result.businessDays).toBe(14); // 10 + 4
      expect(result.weekendDays).toBe(4);
      expect(result.holidayCount).toBe(1);
    });

    it('should handle zero weekends', () => {
      const categories: DayCategories = {
        businessDays: 5,
        weekendDays: 0,
        holidayCount: 0,
      };

      const result = adjustForWeekends(categories, false);

      expect(result.businessDays).toBe(5);
      expect(result.weekendDays).toBe(0);
      expect(result.holidayCount).toBe(0);
    });
  });
});
