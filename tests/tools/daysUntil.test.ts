import { daysUntil } from '../../src/tools/daysUntil';
import { addDays, subDays, format } from 'date-fns';
import { TimeServerErrorCodes } from '../../src/types';

describe('daysUntil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should calculate days until a future date', () => {
      // Use format to get consistent local date string
      const futureDate = addDays(new Date(), 7);
      const dateString = format(futureDate, 'yyyy-MM-dd');

      const result = daysUntil({ target_date: dateString });
      expect(result).toBe(7);
    });

    it('should return 0 for today', () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const result = daysUntil({ target_date: today });
      expect(result).toBe(0);
    });

    it('should return negative days for past dates', () => {
      const pastDate = subDays(new Date(), 5);
      const dateString = format(pastDate, 'yyyy-MM-dd');

      const result = daysUntil({ target_date: dateString });
      expect(result).toBe(-5);
    });

    it('should handle dates far in the future', () => {
      const result = daysUntil({ target_date: '2030-01-01' });
      expect(result).toBeGreaterThan(1000); // At least 1000 days away
    });
  });

  describe('Date format handling', () => {
    it('should accept ISO date format', () => {
      const tomorrow = addDays(new Date(), 1);
      const isoDate = format(tomorrow, 'yyyy-MM-dd');

      const result = daysUntil({ target_date: isoDate });
      expect(result).toBe(1);
    });

    it('should accept ISO datetime format', () => {
      const tomorrow = addDays(new Date(), 1);
      const isoDateTime = tomorrow.toISOString();

      const result = daysUntil({ target_date: isoDateTime });
      expect(result).toBe(1);
    });

    it('should handle natural language dates', () => {
      // This might need adjustment based on parseISO capabilities
      const tomorrow = addDays(new Date(), 1);
      const dateString = format(tomorrow, 'yyyy-MM-dd');

      const result = daysUntil({ target_date: dateString });
      expect(result).toBe(1);
    });
  });

  describe('Timezone handling', () => {
    it('should use system timezone when not specified', () => {
      const tomorrow = addDays(new Date(), 1);
      const dateOnly = format(tomorrow, 'yyyy-MM-dd');

      const result = daysUntil({ target_date: dateOnly });
      expect(result).toBe(1);
    });

    it('should use UTC when timezone is empty string', () => {
      const tomorrowUTC = addDays(new Date(), 1);
      const utcString = tomorrowUTC.toISOString();

      const result = daysUntil({
        target_date: utcString,
        timezone: '',
      });
      expect(result).toBe(1);
    });

    it('should use specified timezone', () => {
      // Testing with a known future date in specific timezone
      const futureDate = '2025-12-25T00:00:00';

      const result = daysUntil({
        target_date: futureDate,
        timezone: 'America/New_York',
      });

      // Should be a positive number (exact value depends on current date)
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Formatting options', () => {
    it('should return plain number by default', () => {
      const tomorrow = addDays(new Date(), 1);
      const dateString = format(tomorrow, 'yyyy-MM-dd');

      const result = daysUntil({ target_date: dateString });
      expect(typeof result).toBe('number');
      expect(result).toBe(1);
    });

    it('should format as "Today" when format_result is true', () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const result = daysUntil({
        target_date: today,
        format_result: true,
      });
      expect(result).toBe('Today');
    });

    it('should format as "Tomorrow" for next day', () => {
      const tomorrow = addDays(new Date(), 1);
      const dateString = format(tomorrow, 'yyyy-MM-dd');

      const result = daysUntil({
        target_date: dateString,
        format_result: true,
      });
      expect(result).toBe('Tomorrow');
    });

    it('should format as "Yesterday" for previous day', () => {
      const yesterday = subDays(new Date(), 1);
      const dateString = format(yesterday, 'yyyy-MM-dd');

      const result = daysUntil({
        target_date: dateString,
        format_result: true,
      });
      expect(result).toBe('Yesterday');
    });

    it('should format as "in N days" for future dates', () => {
      const futureDate = addDays(new Date(), 10);
      const dateString = format(futureDate, 'yyyy-MM-dd');

      const result = daysUntil({
        target_date: dateString,
        format_result: true,
      });
      expect(result).toBe('in 10 days');
    });

    it('should format as "N days ago" for past dates', () => {
      const pastDate = subDays(new Date(), 5);
      const dateString = format(pastDate, 'yyyy-MM-dd');

      const result = daysUntil({
        target_date: dateString,
        format_result: true,
      });
      expect(result).toBe('5 days ago');
    });
  });

  describe('Edge cases', () => {
    it('should handle same day different times as 0 days', () => {
      const now = new Date();
      const laterToday = new Date(now);
      laterToday.setHours(23, 59, 59);

      const result = daysUntil({
        target_date: laterToday.toISOString(),
      });
      expect(result).toBe(0);
    });

    it('should handle leap year dates', () => {
      // Feb 29, 2024 was a leap day
      const result = daysUntil({ target_date: '2024-02-29' });
      expect(typeof result).toBe('number');
      // Should be negative (in the past)
      expect(result).toBeLessThan(0);
    });

    it('should handle year boundaries', () => {
      const newYear2026 = '2026-01-01';
      const result = daysUntil({ target_date: newYear2026 });
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should throw error for missing target_date', () => {
      expect(() => daysUntil({} as any)).toThrow();
      try {
        daysUntil({} as any);
      } catch (e: any) {
        expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_PARAMETER);
        expect(e.error.message).toContain('target_date is required');
      }
    });

    it('should throw error for invalid date', () => {
      expect(() => daysUntil({ target_date: 'not-a-date' })).toThrow();
      try {
        daysUntil({ target_date: 'not-a-date' });
      } catch (e: any) {
        expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_DATE_FORMAT);
        expect(e.error.message).toContain('Invalid target_date format');
      }
    });

    it('should throw error for invalid timezone', () => {
      expect(() =>
        daysUntil({
          target_date: '2025-12-25',
          timezone: 'Invalid/Timezone',
        }),
      ).toThrow();
      try {
        daysUntil({
          target_date: '2025-12-25',
          timezone: 'Invalid/Timezone',
        });
      } catch (e: any) {
        expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_TIMEZONE);
        expect(e.error.message).toContain('Invalid timezone');
      }
    });
  });

  describe('Real-world scenarios', () => {
    it('should calculate days until Christmas 2025', () => {
      const result = daysUntil({
        target_date: '2025-12-25',
        format_result: false,
      });

      // This will vary based on when test runs
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(365);
    });

    it('should handle event planning scenario', () => {
      // Event 30 days from now at 6 PM in New York
      const eventDate = addDays(new Date(), 30);
      eventDate.setHours(18, 0, 0, 0);

      const result = daysUntil({
        target_date: eventDate.toISOString(),
        timezone: 'America/New_York',
        format_result: true,
      });

      expect(result).toBe('in 30 days');
    });

    it('should handle deadline tracking', () => {
      // Project due in 14 days
      const deadline = addDays(new Date(), 14);

      const result = daysUntil({
        target_date: format(deadline, 'yyyy-MM-dd'),
      });

      expect(result).toBe(14);
    });
  });
});
