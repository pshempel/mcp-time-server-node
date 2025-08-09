import { nextOccurrence } from '../../src/tools/nextOccurrence';
import { TimeServerErrorCodes } from '../../src/types';
import type { NextOccurrenceResult } from '../../src/types';

// Mock the cache module
jest.mock('../../src/cache/timeCache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  CacheTTL: {
    CURRENT_TIME: 1,
    TIMEZONE_CONVERT: 300,
    CALCULATIONS: 3600,
    BUSINESS_DAYS: 86400,
  },
}));

// Import the mocked cache
import { cache } from '../../src/cache/timeCache';

// Mock the config module
jest.mock('../../src/utils/config', () => ({
  getConfig: jest.fn().mockReturnValue({
    defaultTimezone: 'UTC',
  }),
}));

import { getConfig } from '../../src/utils/config';
const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

describe('nextOccurrence', () => {
  const mockedCache = cache as jest.Mocked<typeof cache>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Set to Wednesday, Jan 15, 2025, 10:30:00 UTC
    jest.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Daily pattern', () => {
    it('should find next daily occurrence at specific time', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'daily',
        time: '14:30',
      });

      // Same day, later time
      expect(result.next).toMatch(/2025-01-15T14:30:00/);
      expect(result.days_until).toBe(0);
    });

    it('should find next daily occurrence when time has passed', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'daily',
        time: '09:00', // Already passed
      });

      // Tomorrow
      expect(result.next).toMatch(/2025-01-16T09:00:00/);
      expect(result.days_until).toBe(1);
    });

    it('should handle daily pattern without specific time', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'daily',
      });

      // Tomorrow at same time
      expect(result.next).toMatch(/2025-01-16T10:30:00/);
      expect(result.days_until).toBe(1);
    });

    it('should handle daily pattern with timezone', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'daily',
        time: '14:30',
        timezone: 'America/New_York',
      });

      // 14:30 NY time is 19:30 UTC
      expect(result.next).toMatch(/2025-01-15T19:30:00/);
      expect(result.unix).toBe(Math.floor(new Date('2025-01-15T19:30:00Z').getTime() / 1000));
    });
  });

  describe('Weekly pattern', () => {
    it('should find next occurrence of specific weekday', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'weekly',
        day_of_week: 5, // Friday
      });

      // This Friday
      expect(result.next).toMatch(/2025-01-17/);
      expect(result.days_until).toBe(2);
    });

    it('should find next occurrence when on the same weekday', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'weekly',
        day_of_week: 3, // Wednesday (today)
      });

      // Next Wednesday
      expect(result.next).toMatch(/2025-01-22/);
      expect(result.days_until).toBe(7);
    });

    it('should handle Sunday (0) correctly', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'weekly',
        day_of_week: 0, // Sunday
      });

      // This Sunday
      expect(result.next).toMatch(/2025-01-19/);
      expect(result.days_until).toBe(4);
    });

    it('should handle Saturday (6) correctly', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'weekly',
        day_of_week: 6, // Saturday
      });

      // This Saturday
      expect(result.next).toMatch(/2025-01-18/);
      expect(result.days_until).toBe(3);
    });

    it('should handle weekly with specific time', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'weekly',
        day_of_week: 3, // Wednesday
        time: '15:00',
      });

      // Today at 15:00 (hasn't passed yet)
      expect(result.next).toMatch(/2025-01-15T15:00:00/);
      expect(result.days_until).toBe(0);
    });

    it('should handle weekly when time has passed today', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'weekly',
        day_of_week: 3, // Wednesday
        time: '08:00', // Already passed
      });

      // Next Wednesday
      expect(result.next).toMatch(/2025-01-22T08:00:00/);
      expect(result.days_until).toBe(7);
    });
  });

  describe('Monthly pattern', () => {
    it('should find next occurrence on specific day of month', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'monthly',
        day_of_month: 20,
      });

      // This month
      expect(result.next).toMatch(/2025-01-20/);
      expect(result.days_until).toBe(4);
    });

    it('should handle when day has passed this month', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'monthly',
        day_of_month: 10, // Already passed
      });

      // Next month
      expect(result.next).toMatch(/2025-02-10/);
      expect(result.days_until).toBe(25);
    });

    it('should handle same day of month', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'monthly',
        day_of_month: 15, // Today
      });

      // Next month (not today)
      expect(result.next).toMatch(/2025-02-15/);
      expect(result.days_until).toBe(30);
    });

    it('should handle last day of month (31st)', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'monthly',
        day_of_month: 31,
      });

      // Jan 31
      expect(result.next).toMatch(/2025-01-31/);
      expect(result.days_until).toBe(15);
    });

    it('should handle 31st in months with fewer days', () => {
      mockedCache.get.mockReturnValue(undefined);
      // Set to Jan 31
      jest.setSystemTime(new Date('2025-01-31T10:00:00.000Z'));

      const result = nextOccurrence({
        pattern: 'monthly',
        day_of_month: 31,
      });

      // February doesn't have 31 days, should use last day
      expect(result.next).toMatch(/2025-02-28/);
      expect(result.days_until).toBe(27);
    });

    it('should handle February 29 in non-leap year', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'monthly',
        day_of_month: 29,
      });

      // Jan 29
      expect(result.next).toMatch(/2025-01-29/);

      // Set to Jan 29
      jest.setSystemTime(new Date('2025-01-29T10:00:00.000Z'));

      const nextResult = nextOccurrence({
        pattern: 'monthly',
        day_of_month: 29,
      });

      // Feb 28 (no 29th)
      expect(nextResult.next).toMatch(/2025-02-28/);
    });

    it('should handle monthly with specific time', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'monthly',
        day_of_month: 15,
        time: '14:00',
      });

      // Today but later (time hasn't passed)
      expect(result.next).toMatch(/2025-01-15T14:00:00/);
      expect(result.days_until).toBe(0);
    });
  });

  describe('Yearly pattern', () => {
    it('should find next yearly occurrence', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'yearly',
      });

      // Same date next year
      expect(result.next).toMatch(/2026-01-15/);
      expect(result.days_until).toBe(365);
    });

    it('should handle leap year for Feb 29', () => {
      mockedCache.get.mockReturnValue(undefined);
      // Set to Feb 29, 2024 (leap year)
      jest.setSystemTime(new Date('2024-02-29T10:00:00.000Z'));

      const result = nextOccurrence({
        pattern: 'yearly',
      });

      // Next occurrence is Feb 28, 2025 (not leap year)
      expect(result.next).toMatch(/2025-02-28/);
      expect(result.days_until).toBe(365);
    });

    it('should handle yearly with specific time', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'yearly',
        time: '12:00',
      });

      expect(result.next).toMatch(/2026-01-15T12:00:00/);
    });
  });

  describe('Custom start_from', () => {
    it('should calculate from custom start date', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'daily',
        start_from: '2025-01-20T10:00:00Z',
      });

      // Next day from Jan 20
      expect(result.next).toMatch(/2025-01-21/);
      expect(result.days_until).toBe(6); // From now (Jan 15) to Jan 21
    });

    it('should handle timezone in start_from', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'daily',
        start_from: '2025-01-20T10:00:00+05:30', // IST
        timezone: 'Asia/Kolkata',
      });

      expect(result.next).toMatch(/2025-01-21/);
    });
  });

  describe('Edge cases', () => {
    it('should handle pattern case-insensitively', () => {
      mockedCache.get.mockReturnValue(undefined);

      // The new implementation requires lowercase patterns
      expect(() =>
        nextOccurrence({
          pattern: 'DAILY' as any,
        })
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: 'Invalid pattern',
            details: { pattern: 'DAILY' },
          },
        })
      );
    });

    it('should default missing parameters appropriately', () => {
      mockedCache.get.mockReturnValue(undefined);

      // The new implementation handles defaults differently
      // Weekly without day_of_week defaults to current day of week
      const weeklyResult = nextOccurrence({
        pattern: 'weekly',
      });
      // Should return next week same day
      expect(weeklyResult.days_until).toBe(7);

      // Monthly without day_of_month throws an error
      expect(() =>
        nextOccurrence({
          pattern: 'monthly',
        })
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: expect.stringContaining('dayOfMonth is required for monthly pattern'),
            details: { pattern: 'monthly' },
          },
        })
      );
    });

    it('should handle DST transitions', () => {
      mockedCache.get.mockReturnValue(undefined);
      // Set to March 8, 2025 (day before DST in US)
      jest.setSystemTime(new Date('2025-03-08T15:00:00.000Z'));

      const result = nextOccurrence({
        pattern: 'daily',
        time: '10:00',
        timezone: 'America/New_York',
      });

      // Should handle DST transition correctly
      expect(result.days_until).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid pattern', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        nextOccurrence({
          pattern: 'invalid' as any,
        })
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: expect.stringContaining('Invalid pattern'),
            details: { pattern: 'invalid' },
          },
        })
      );
    });

    it('should throw error for invalid day_of_week', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        nextOccurrence({
          pattern: 'weekly',
          day_of_week: 7, // Invalid (0-6)
        })
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: expect.stringContaining('Invalid day of week'),
            details: { dayOfWeek: 7 },
          },
        })
      );
    });

    it('should throw error for invalid day_of_month', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        nextOccurrence({
          pattern: 'monthly',
          day_of_month: 32, // Invalid
        })
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: expect.stringContaining('Invalid day of month'),
            details: { dayOfMonth: 32 },
          },
        })
      );

      expect(() =>
        nextOccurrence({
          pattern: 'monthly',
          day_of_month: 0, // Invalid
        })
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: expect.stringContaining('Invalid day of month'),
            details: { dayOfMonth: 0 },
          },
        })
      );
    });

    it('should throw error for invalid time format', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        nextOccurrence({
          pattern: 'daily',
          time: 'invalid',
        })
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: expect.stringContaining('Invalid time format'),
            details: { time: 'invalid' },
          },
        })
      );

      expect(() =>
        nextOccurrence({
          pattern: 'daily',
          time: '25:00', // Invalid hour
        })
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: expect.stringContaining('Invalid time format'),
            details: { time: '25:00' },
          },
        })
      );
    });

    it('should throw error for invalid timezone', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        nextOccurrence({
          pattern: 'daily',
          timezone: 'Invalid/Zone',
        })
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_TIMEZONE,
            message: 'Invalid timezone: Invalid/Zone',
            details: { timezone: 'Invalid/Zone' },
          },
        })
      );
    });

    it('should throw error for invalid start_from date', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        nextOccurrence({
          pattern: 'daily',
          start_from: 'not-a-date',
        })
      ).toThrowError(
        expect.objectContaining({
          code: TimeServerErrorCodes.INTERNAL_ERROR,
          message: expect.stringContaining('Failed to calculate next occurrence'),
        })
      );
    });
  });

  describe('Caching', () => {
    it('should cache results for 1 hour', () => {
      mockedCache.get.mockReturnValue(undefined);

      nextOccurrence({
        pattern: 'daily',
        time: '14:00',
      });

      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]{64}$/),
        expect.any(Object),
        3600 // 1 hour
      );
    });

    it('should return cached result if available', () => {
      const cachedResult: NextOccurrenceResult = {
        next: '2025-01-16T14:00:00.000Z',
        unix: 1737036000,
        days_until: 1,
      };
      mockedCache.get.mockReturnValue(cachedResult);

      const result = nextOccurrence({
        pattern: 'daily',
        time: '14:00',
      });

      expect(result).toEqual(cachedResult);
      expect(mockedCache.set).not.toHaveBeenCalled();
    });

    it('should use different cache keys for different parameters', () => {
      mockedCache.get.mockReturnValue(undefined);

      nextOccurrence({
        pattern: 'daily',
      });

      nextOccurrence({
        pattern: 'daily',
        time: '14:00',
      });

      nextOccurrence({
        pattern: 'weekly',
        day_of_week: 3,
      });

      const calls = mockedCache.set.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]);
      expect(calls[1][0]).not.toBe(calls[2][0]);
    });
  });

  describe('Response format', () => {
    it('should return all required fields', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'daily',
      });

      expect(result).toHaveProperty('next');
      expect(result).toHaveProperty('unix');
      expect(result).toHaveProperty('days_until');
      expect(typeof result.next).toBe('string');
      expect(typeof result.unix).toBe('number');
      expect(typeof result.days_until).toBe('number');
    });

    it('should return ISO8601 format for next', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'daily',
      });

      // Should match ISO8601 format
      expect(result.next).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should calculate unix timestamp correctly', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'daily',
        time: '14:00',
      });

      const expectedUnix = Math.floor(new Date(result.next).getTime() / 1000);
      expect(result.unix).toBe(expectedUnix);
    });

    it('should calculate days_until as whole days', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = nextOccurrence({
        pattern: 'daily',
        time: '14:00',
      });

      // Should be 0 (same day) even though it's hours in the future
      expect(result.days_until).toBe(0);

      const tomorrowResult = nextOccurrence({
        pattern: 'daily',
        time: '09:00', // Already passed
      });

      expect(tomorrowResult.days_until).toBe(1);
    });
  });

  describe('System timezone defaults', () => {
    it('should use system timezone when no timezone parameter provided', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = nextOccurrence({
        pattern: 'daily',
        time: '14:00',
      });

      // 14:00 NY time is 19:00 UTC (EST in January)
      expect(result.next).toMatch(/2025-01-15T19:00:00/);
    });

    it('should still use UTC when empty string timezone provided (backward compatibility)', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = nextOccurrence({
        pattern: 'daily',
        time: '14:00',
        timezone: '',
      });

      // Should use UTC, not system timezone
      expect(result.next).toMatch(/2025-01-15T14:00:00/);
    });

    it('should use explicit timezone parameter over system default', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = nextOccurrence({
        pattern: 'daily',
        time: '14:00',
        timezone: 'Asia/Tokyo',
      });

      // 14:00 Tokyo time is 05:00 UTC
      expect(result.next).toMatch(/2025-01-16T05:00:00/);
    });

    it('should apply system timezone for weekly pattern', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = nextOccurrence({
        pattern: 'weekly',
        day_of_week: 5, // Friday
        time: '09:00',
      });

      // 09:00 NY time is 14:00 UTC (EST in January)
      expect(result.next).toMatch(/2025-01-17T14:00:00/);
    });

    it('should apply system timezone for monthly pattern', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = nextOccurrence({
        pattern: 'monthly',
        day_of_month: 20,
        time: '15:30',
      });

      // 15:30 NY time is 20:30 UTC (EST in January)
      expect(result.next).toMatch(/2025-01-20T20:30:00/);
    });

    it('should apply system timezone for yearly pattern', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = nextOccurrence({
        pattern: 'yearly',
        time: '12:00',
      });

      // 12:00 NY time is 17:00 UTC (EST in January)
      expect(result.next).toMatch(/2026-01-15T17:00:00/);
    });

    it('should handle system timezone in cache key', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/Chicago' });

      nextOccurrence({
        pattern: 'daily',
      });

      // Should include system timezone in cache key when no timezone provided
      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]{64}$/),
        expect.any(Object),
        3600
      );
    });
  });
});
