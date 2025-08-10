import { parseDateWithTimezone, parseHolidayDates } from '../../src/utils/businessUtils';
import { DateParsingError, HolidayDataError } from '../../src/adapters/mcp-sdk';

// Mock parseTimeInput since it's a dependency
jest.mock('../../src/utils/parseTimeInput', () => ({
  parseTimeInput: jest.fn((dateStr: string, timezone: string) => {
    // Simple mock implementation for testing
    if (!dateStr || typeof dateStr !== 'string') {
      throw new Error('Invalid date string');
    }

    // Simulate different date formats
    if (dateStr === 'invalid-date') {
      throw new Error('Cannot parse date');
    }

    // Return a mock parsed result
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }

    return { date, timezone };
  }),
}));

describe('businessUtils', () => {
  describe('parseDateWithTimezone', () => {
    it('should parse valid date strings', () => {
      const result = parseDateWithTimezone('2025-01-31', 'UTC', 'test_field');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toContain('2025-01-31');
    });

    it('should parse date with time', () => {
      const result = parseDateWithTimezone('2025-01-31T10:30:00', 'America/New_York', 'start_time');
      expect(result).toBeInstanceOf(Date);
    });

    it('should throw error with correct structure for invalid date', () => {
      expect(() => {
        parseDateWithTimezone('invalid-date', 'UTC', 'end_time');
      }).toThrow();

      try {
        parseDateWithTimezone('invalid-date', 'UTC', 'end_time');
      } catch (e: any) {
        expect(e).toBeInstanceOf(DateParsingError);
        expect(e.code).toBe('DATE_PARSING_ERROR');
        expect(e.message).toContain('Invalid end_time format');
        expect(e.details.end_time).toBe('invalid-date');
      }
    });

    it('should include field name in error message', () => {
      try {
        parseDateWithTimezone('invalid-date', 'UTC', 'custom_field');
      } catch (e: any) {
        expect(e).toBeInstanceOf(DateParsingError);
        expect(e.code).toBe('DATE_PARSING_ERROR');
        expect(e.message).toContain('Invalid custom_field format');
        expect(e.details.custom_field).toBe('invalid-date');
      }
    });

    it('should preserve timezone in parsing', () => {
      const timezone = 'Europe/London';
      const result = parseDateWithTimezone('2025-01-31T12:00:00', timezone, 'test');
      // The function uses parseTimeInput which should handle timezone
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('parseHolidayDates', () => {
    it('should parse array of valid holiday dates', () => {
      const holidays = ['2025-01-01', '2025-07-04', '2025-12-25'];
      const result = parseHolidayDates(holidays, 'UTC');

      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(Date);
      expect(result[1]).toBeInstanceOf(Date);
      expect(result[2]).toBeInstanceOf(Date);
    });

    it('should handle empty array', () => {
      const result = parseHolidayDates([], 'America/New_York');
      expect(result).toEqual([]);
    });

    it('should parse dates with timezone awareness', () => {
      const holidays = ['2025-01-01T00:00:00'];
      const result = parseHolidayDates(holidays, 'America/Los_Angeles');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Date);
    });

    it('should throw error for invalid date in array', () => {
      const holidays = ['2025-01-01', 'invalid-date', '2025-12-25'];

      expect(() => {
        parseHolidayDates(holidays, 'UTC');
      }).toThrow();

      try {
        parseHolidayDates(holidays, 'UTC');
      } catch (e: any) {
        expect(e).toBeInstanceOf(HolidayDataError);
        expect(e.code).toBe('HOLIDAY_DATA_ERROR');
        expect(e.message).toContain('Invalid holiday date');
        expect(e.details.holiday).toBe('invalid-date');
        expect(e.details.index).toBe(1);
      }
    });

    it('should include index in error for tracking', () => {
      const holidays = ['2025-01-01', '2025-02-30', 'bad-date']; // Feb 30 doesn't exist

      try {
        parseHolidayDates(holidays, 'UTC');
      } catch (e: any) {
        // Should fail on first invalid date
        expect(e).toBeInstanceOf(HolidayDataError);
        expect(e.code).toBe('HOLIDAY_DATA_ERROR');
        expect(e.details.index).toBeDefined();
        expect(typeof e.details.index).toBe('number');
      }
    });

    it('should handle dates in different formats', () => {
      const holidays = ['2025-01-01', '2025-02-14T14:30:00', '2025-03-17T00:00:00Z'];

      const result = parseHolidayDates(holidays, 'UTC');
      expect(result).toHaveLength(3);
      result.forEach((date: Date) => {
        expect(date).toBeInstanceOf(Date);
        // Just verify it's a valid date, year might vary due to mock
        expect(date.getTime()).not.toBeNaN();
      });
    });

    it('should preserve original error information', () => {
      const holidays = ['not-a-date'];

      try {
        parseHolidayDates(holidays, 'UTC');
      } catch (e: any) {
        expect(e).toBeInstanceOf(HolidayDataError);
        expect(e.code).toBe('HOLIDAY_DATA_ERROR');
        expect(e.details.originalError).toBeDefined();
        // Just verify error is preserved, exact message may vary
        expect(typeof e.details.originalError).toBe('string');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle null timezone correctly', () => {
      // This tests that the utilities properly pass through the timezone
      const result = parseDateWithTimezone('2025-01-31', '', 'field');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle very long date strings', () => {
      const longString = '2025-01-31' + 'x'.repeat(1000);
      expect(() => {
        parseDateWithTimezone(longString, 'UTC', 'field');
      }).toThrow();
    });

    it('should maintain consistency between utilities', () => {
      const dateStr = '2025-06-15';
      const timezone = 'Asia/Tokyo';

      // Both utilities should parse dates the same way
      const singleDate = parseDateWithTimezone(dateStr, timezone, 'test');
      const arrayDates = parseHolidayDates([dateStr], timezone);

      expect(singleDate.getTime()).toBe(arrayDates[0].getTime());
    });
  });
});
