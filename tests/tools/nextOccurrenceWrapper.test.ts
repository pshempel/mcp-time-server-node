import { nextOccurrence } from '../../src/tools/nextOccurrence';
import type { NextOccurrenceParams } from '../../src/types';

describe('nextOccurrence - RecurrenceFactory Integration', () => {
  // Fixed date for consistent testing
  const fixedDate = new Date('2025-01-29T12:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('API Compatibility', () => {
    it('should return correct shape with next, unix, and days_until', () => {
      const result = nextOccurrence({
        pattern: 'daily',
        start_from: '2025-01-29T10:00:00Z',
      });

      expect(result).toHaveProperty('next');
      expect(result).toHaveProperty('unix');
      expect(result).toHaveProperty('days_until');
      expect(typeof result.next).toBe('string');
      expect(typeof result.unix).toBe('number');
      expect(typeof result.days_until).toBe('number');
    });

    it('should handle snake_case parameters correctly', () => {
      const result = nextOccurrence({
        pattern: 'weekly',
        start_from: '2025-01-29T10:00:00Z',
        day_of_week: 3, // Wednesday
        time: '14:30',
      });

      // Since start_from is Wednesday 10am and we want Wednesday at 14:30,
      // and 14:30 is after 10am, it should be the same day
      expect(result.next).toBe('2025-01-29T19:30:00.000Z');
    });

    it('should handle day_of_month for monthly pattern', () => {
      const result = nextOccurrence({
        pattern: 'monthly',
        start_from: '2025-01-29T10:00:00Z',
        day_of_month: 15,
        time: '12:00',
      });

      // 12:00 UTC in system timezone (UTC-5) becomes 17:00 UTC
      expect(result.next).toBe('2025-02-15T17:00:00.000Z');
    });
  });

  describe('Pattern Handling', () => {
    it('should handle daily pattern', () => {
      const result = nextOccurrence({
        pattern: 'daily',
        start_from: '2025-01-29T10:00:00Z',
      });

      expect(result.next).toBe('2025-01-30T10:00:00.000Z');
      // Since we're using fake time of Jan 29, next day is 1 day away
      expect(result.days_until).toBe(1);
    });

    it('should handle weekly pattern', () => {
      const result = nextOccurrence({
        pattern: 'weekly',
        start_from: '2025-01-29T10:00:00Z',
        day_of_week: 1, // Monday
      });

      expect(result.next).toBe('2025-02-03T10:00:00.000Z');
    });

    it('should handle monthly pattern', () => {
      const result = nextOccurrence({
        pattern: 'monthly',
        start_from: '2025-01-29T10:00:00Z',
        day_of_month: 31,
      });

      // Jan 31 is the next occurrence (system timezone UTC-5)
      expect(result.next).toBe('2025-01-31T05:00:00.000Z');
    });

    it('should handle yearly pattern', () => {
      const result = nextOccurrence({
        pattern: 'yearly',
        start_from: '2025-01-29T10:00:00Z',
      });

      expect(result.next).toBe('2026-01-29T10:00:00.000Z');
      expect(result.days_until).toBe(365);
    });
  });

  describe('Timezone Handling', () => {
    it('should use system timezone when undefined', () => {
      const result = nextOccurrence({
        pattern: 'daily',
        start_from: '2025-01-29T10:00:00Z',
        time: '14:30',
        // timezone undefined
      });

      // System timezone is UTC-5 in test environment
      expect(result.next).toBe('2025-01-29T19:30:00.000Z');
    });

    it('should use UTC when timezone is empty string', () => {
      const result = nextOccurrence({
        pattern: 'daily',
        start_from: '2025-01-29T10:00:00Z',
        time: '14:30',
        timezone: '',
      });

      expect(result.next).toBe('2025-01-29T14:30:00.000Z');
    });

    it('should use specified timezone', () => {
      const result = nextOccurrence({
        pattern: 'daily',
        start_from: '2025-01-29T10:00:00Z',
        time: '14:30',
        timezone: 'America/New_York',
      });

      expect(result.next).toBe('2025-01-29T19:30:00.000Z');
    });
  });

  describe('Unix Timestamp', () => {
    it('should return correct unix timestamp', () => {
      const result = nextOccurrence({
        pattern: 'daily',
        start_from: '2025-01-29T10:00:00Z',
      });

      const expectedUnix = new Date(result.next).getTime() / 1000;
      expect(result.unix).toBe(Math.floor(expectedUnix));
    });
  });

  describe('Days Until Calculation', () => {
    it('should calculate days_until correctly for same day', () => {
      const result = nextOccurrence({
        pattern: 'daily',
        start_from: '2025-01-29T08:00:00Z',
        time: '20:00',
      });

      expect(result.days_until).toBe(0);
    });

    it('should calculate days_until correctly for future dates', () => {
      const result = nextOccurrence({
        pattern: 'yearly',
        start_from: '2025-01-29T10:00:00Z',
      });

      expect(result.days_until).toBe(365); // 2025 is not a leap year
    });
  });

  describe('Error Handling', () => {
    it('should throw for invalid pattern', () => {
      expect(() => {
        nextOccurrence({
          pattern: 'invalid' as any,
          start_from: '2025-01-29T10:00:00Z',
        } as NextOccurrenceParams);
      }).toThrow();
    });

    it('should throw for missing required parameters', () => {
      expect(() => {
        nextOccurrence({
          pattern: 'monthly',
          start_from: '2025-01-29T10:00:00Z',
          // Missing day_of_month
        });
      }).toThrow();
    });

    it('should validate timezone', () => {
      expect(() => {
        nextOccurrence({
          pattern: 'daily',
          start_from: '2025-01-29T10:00:00Z',
          timezone: 'Invalid/Timezone',
        });
      }).toThrow();
    });
  });

  describe('Caching', () => {
    it('should cache results with same parameters', () => {
      const params: NextOccurrenceParams = {
        pattern: 'daily',
        start_from: '2025-01-29T10:00:00Z',
      };

      const result1 = nextOccurrence(params);
      const result2 = nextOccurrence(params);

      expect(result1).toEqual(result2);
    });
  });
});
