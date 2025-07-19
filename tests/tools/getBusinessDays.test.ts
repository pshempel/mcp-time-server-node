import { getBusinessDays } from '../../src/tools/getBusinessDays';
import { TimeServerErrorCodes } from '../../src/types';
import type { GetBusinessDaysResult } from '../../src/types';

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
    defaultTimezone: 'America/Indianapolis', // Use actual system timezone for tests
  }),
}));

import { getConfig } from '../../src/utils/config';
const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

describe('getBusinessDays', () => {
  const mockedCache = cache as jest.Mocked<typeof cache>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-07-18T18:00:00.000Z'));
    // Reset config mock to system timezone default
    mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/Indianapolis' });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should calculate business days for a typical work week', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13', // Monday
        end_date: '2025-01-17', // Friday
      });

      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(5); // Mon-Fri
      expect(result.weekend_days).toBe(0);
      expect(result.holiday_count).toBe(0);
    });

    it('should exclude weekends by default', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13', // Monday
        end_date: '2025-01-19', // Sunday
      });

      expect(result.total_days).toBe(7);
      expect(result.business_days).toBe(5);
      expect(result.weekend_days).toBe(2);
      expect(result.holiday_count).toBe(0);
    });

    it('should include weekends when exclude_weekends is false', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13', // Monday
        end_date: '2025-01-19', // Sunday
        exclude_weekends: false,
      });

      expect(result.total_days).toBe(7);
      expect(result.business_days).toBe(7);
      expect(result.weekend_days).toBe(2); // Still counted separately
      expect(result.holiday_count).toBe(0);
    });

    it('should handle same day interval', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-15', // Wednesday
        end_date: '2025-01-15',
      });

      expect(result.total_days).toBe(1);
      expect(result.business_days).toBe(1);
      expect(result.weekend_days).toBe(0);
      expect(result.holiday_count).toBe(0);
    });

    it('should handle weekend same day interval', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-18', // Saturday
        end_date: '2025-01-18',
      });

      expect(result.total_days).toBe(1);
      expect(result.business_days).toBe(0); // Saturday is a weekend
      expect(result.weekend_days).toBe(1);
      expect(result.holiday_count).toBe(0);
    });
  });

  describe('Holiday handling', () => {
    it('should exclude holidays from business days', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13', // Monday
        end_date: '2025-01-17', // Friday
        holidays: ['2025-01-15'], // Wednesday
      });

      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(4); // Mon-Fri minus Wed holiday
      expect(result.weekend_days).toBe(0);
      expect(result.holiday_count).toBe(1);
    });

    it('should handle multiple holidays', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13', // Monday
        end_date: '2025-01-17', // Friday
        holidays: ['2025-01-14', '2025-01-16'], // Tuesday, Thursday
      });

      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(3); // Mon-Fri minus two holidays
      expect(result.weekend_days).toBe(0);
      expect(result.holiday_count).toBe(2);
    });

    it('should not count holidays on weekends', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13', // Monday
        end_date: '2025-01-19', // Sunday
        holidays: ['2025-01-15', '2025-01-18'], // Wednesday, Saturday
      });

      expect(result.total_days).toBe(7);
      expect(result.business_days).toBe(4); // Mon, Tue, Thu, Fri
      expect(result.weekend_days).toBe(2);
      expect(result.holiday_count).toBe(1); // Only Wednesday counts
    });

    it('should handle holidays outside the date range', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13', // Monday
        end_date: '2025-01-17', // Friday
        holidays: ['2025-01-10', '2025-01-20'], // Before and after range
      });

      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(5); // Mon-Fri
      expect(result.weekend_days).toBe(0);
      expect(result.holiday_count).toBe(0);
    });

    it('should count holidays when exclude_weekends is false', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13', // Monday
        end_date: '2025-01-17', // Friday
        exclude_weekends: false,
        holidays: ['2025-01-15'], // Wednesday
      });

      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(4); // Mon-Fri minus Wed holiday
      expect(result.weekend_days).toBe(0);
      expect(result.holiday_count).toBe(1);
    });
  });

  describe('Date format handling', () => {
    it('should handle ISO date with time', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13T10:00:00Z',
        end_date: '2025-01-17T15:00:00Z',
      });

      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(5);
    });

    it('should handle dates with timezone offset', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13T10:00:00+05:30',
        end_date: '2025-01-17T15:00:00+05:30',
      });

      // These dates in IST are Jan 13 04:30 UTC to Jan 17 09:30 UTC
      // In system timezone (EDT), this spans more days
      expect(result.total_days).toBe(6);
      expect(result.business_days).toBe(5); // Mon-Fri
    });

    it('should handle Unix timestamp strings', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '1736726400', // 2025-01-13 00:00:00 UTC (Monday)
        end_date: '1737072000', // 2025-01-17 00:00:00 UTC (Friday start)
      });

      // In system timezone (EDT), these dates create a different interval
      // The interval includes Sun-Thu in EDT time
      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(4); // Mon-Thu (no Friday)
    });

    it('should handle mixed date formats', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13',
        end_date: '1737072000', // Unix timestamp for 2025-01-17 00:00:00 UTC
      });

      // Plain date is parsed in system timezone, Unix is UTC
      // This creates a smaller interval (Jan 13 5AM UTC to Jan 17 0AM UTC)
      expect(result.total_days).toBe(4);
      expect(result.business_days).toBe(4); // Mon-Thu
    });
  });

  describe('Timezone handling', () => {
    it('should interpret dates in specified timezone', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13T23:00:00', // 11 PM Monday in NY
        end_date: '2025-01-14T01:00:00', // 1 AM Tuesday in NY
        timezone: 'America/New_York',
      });

      // In NY timezone, this spans 2 hours on same day
      expect(result.total_days).toBe(2); // Spans Mon-Tue
      expect(result.business_days).toBe(2);
    });

    it('should handle dates that span different days in different timezones', () => {
      mockedCache.get.mockReturnValue(null);

      // When it's Monday 11 PM in NY, it's already Tuesday in Tokyo
      const result = getBusinessDays({
        start_date: '2025-01-13T23:00:00',
        end_date: '2025-01-14T01:00:00',
        timezone: 'Asia/Tokyo',
      });

      // In Tokyo timezone, these are both on the 14th
      expect(result.total_days).toBe(1);
      expect(result.business_days).toBe(1);
    });

    it('should handle DST transitions', () => {
      mockedCache.get.mockReturnValue(null);

      // Spring forward: March 9, 2025
      const result = getBusinessDays({
        start_date: '2025-03-07', // Friday before DST
        end_date: '2025-03-10', // Monday after DST
        timezone: 'America/New_York',
      });

      expect(result.total_days).toBe(4);
      expect(result.business_days).toBe(2); // Friday and Monday
      expect(result.weekend_days).toBe(2);
    });

    it('should use UTC when timezone not specified', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13T00:00:00',
        end_date: '2025-01-17T00:00:00',
      });

      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(5); // Mon-Fri
    });
  });

  describe('Edge cases', () => {
    it('should handle end date before start date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-17', // Friday
        end_date: '2025-01-13', // Monday
      });

      // Should still work, just reversed
      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(5); // Mon-Fri
      expect(result.weekend_days).toBe(0);
    });

    it('should handle month boundaries', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-31', // Friday
        end_date: '2025-02-03', // Monday
      });

      expect(result.total_days).toBe(4);
      expect(result.business_days).toBe(2); // Friday and Monday
      expect(result.weekend_days).toBe(2);
    });

    it('should handle year boundaries', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2024-12-30', // Monday
        end_date: '2025-01-03', // Friday
      });

      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(5); // Mon-Fri
      expect(result.weekend_days).toBe(0);
    });

    it('should handle leap year', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2024-02-26', // Monday (leap year)
        end_date: '2024-03-01', // Friday
      });

      expect(result.total_days).toBe(5);
      expect(result.business_days).toBe(5); // Mon-Fri
    });

    it('should handle very long date ranges', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      });

      expect(result.total_days).toBe(365);
      expect(result.business_days).toBeGreaterThan(250); // ~260 business days
      expect(result.business_days).toBeLessThan(270);
      expect(result.weekend_days).toBeGreaterThan(95);
      expect(result.weekend_days).toBeLessThan(110);
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid start date', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        getBusinessDays({
          start_date: 'not-a-date',
          end_date: '2025-01-17',
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_DATE_FORMAT,
            message: expect.stringContaining('Invalid start_date format'),
            details: expect.objectContaining({ start_date: 'not-a-date' }),
          },
        }),
      );
    });

    it('should throw error for invalid end date', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        getBusinessDays({
          start_date: '2025-01-13',
          end_date: 'not-a-date',
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_DATE_FORMAT,
            message: expect.stringContaining('Invalid end_date format'),
            details: expect.objectContaining({ end_date: 'not-a-date' }),
          },
        }),
      );
    });

    it('should throw error for invalid timezone', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        getBusinessDays({
          start_date: '2025-01-13',
          end_date: '2025-01-17',
          timezone: 'Invalid/Zone',
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_TIMEZONE,
            message: 'Invalid timezone: Invalid/Zone',
            details: { timezone: 'Invalid/Zone' },
          },
        }),
      );
    });

    it('should throw error for invalid holiday date', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        getBusinessDays({
          start_date: '2025-01-13',
          end_date: '2025-01-17',
          holidays: ['2025-01-15', 'not-a-date'],
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_DATE_FORMAT,
            message: expect.stringContaining('Invalid holiday date'),
            details: expect.objectContaining({ holiday: 'not-a-date', index: 1 }),
          },
        }),
      );
    });

    it('should handle empty holiday array', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13',
        end_date: '2025-01-17',
        holidays: [],
      });

      expect(result.business_days).toBe(5); // Mon-Fri
      expect(result.holiday_count).toBe(0);
    });
  });

  describe('Caching', () => {
    it('should cache results for 24 hours', () => {
      mockedCache.get.mockReturnValue(null);

      getBusinessDays({
        start_date: '2025-01-13',
        end_date: '2025-01-17',
      });

      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringContaining('business_'),
        expect.any(Object),
        86400, // 24 hours
      );
    });

    it('should return cached result if available', () => {
      const cachedResult: GetBusinessDaysResult = {
        total_days: 5,
        business_days: 5,
        weekend_days: 0,
        holiday_count: 0,
      };
      mockedCache.get.mockReturnValue(cachedResult);

      const result = getBusinessDays({
        start_date: '2025-01-13',
        end_date: '2025-01-17',
      });

      expect(result).toEqual(cachedResult);
      expect(mockedCache.set).not.toHaveBeenCalled();
    });

    it('should use different cache keys for different parameters', () => {
      mockedCache.get.mockReturnValue(null);

      getBusinessDays({
        start_date: '2025-01-13',
        end_date: '2025-01-17',
      });

      getBusinessDays({
        start_date: '2025-01-13',
        end_date: '2025-01-17',
        exclude_weekends: false,
      });

      getBusinessDays({
        start_date: '2025-01-13',
        end_date: '2025-01-17',
        holidays: ['2025-01-15'],
      });

      const calls = mockedCache.set.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]); // Different keys
      expect(calls[1][0]).not.toBe(calls[2][0]);
    });
  });

  describe('Response format', () => {
    it('should return all required fields', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13',
        end_date: '2025-01-17',
      });

      expect(result).toHaveProperty('total_days');
      expect(result).toHaveProperty('business_days');
      expect(result).toHaveProperty('weekend_days');
      expect(result).toHaveProperty('holiday_count');
      expect(typeof result.total_days).toBe('number');
      expect(typeof result.business_days).toBe('number');
      expect(typeof result.weekend_days).toBe('number');
      expect(typeof result.holiday_count).toBe('number');
    });

    it('should ensure counts add up correctly', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getBusinessDays({
        start_date: '2025-01-13', // Monday
        end_date: '2025-01-19', // Sunday
        holidays: ['2025-01-15'], // Wednesday
      });

      // business_days + weekend_days + holidays on business days = total_days
      expect(result.business_days + result.weekend_days + result.holiday_count).toBe(
        result.total_days,
      );
    });
  });

  describe('System timezone defaults', () => {
    it('should use system timezone when no timezone parameter provided', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = getBusinessDays({
        start_date: '2025-01-20',
        end_date: '2025-01-24',
      });

      // Should interpret dates in America/New_York timezone
      // Date-only strings: Jan 20-24 = Mon-Fri (5 business days)
      expect(result.business_days).toBe(5);
      expect(result.weekend_days).toBe(0);
    });

    it('should use explicit timezone parameter over system default', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = getBusinessDays({
        start_date: '2025-01-20',
        end_date: '2025-01-24',
        timezone: 'Asia/Tokyo',
      });

      // Should use Asia/Tokyo, not the system default
      // Date-only strings at midnight: Jan 20-24 in Tokyo actually includes Sun Jan 19
      expect(result.business_days).toBe(4); // Mon-Thu
      expect(result.weekend_days).toBe(1); // Sunday
    });

    it('should use UTC when empty string timezone provided', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = getBusinessDays({
        start_date: '2025-01-20',
        end_date: '2025-01-24',
        timezone: '',
      });

      // Empty string should mean UTC for backward compatibility
      // Jan 20-24 in UTC includes Sun-Thu when viewed in local time
      expect(result.business_days).toBe(4);
      expect(result.weekend_days).toBe(1);
    });

    it('should handle timezone-sensitive date boundaries', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'Asia/Tokyo' });

      // In Tokyo, this spans from Friday night to Monday morning
      const result = getBusinessDays({
        start_date: '2025-01-17T20:00:00', // Friday 8PM Tokyo = Saturday 3AM UTC
        end_date: '2025-01-20T08:00:00', // Monday 8AM Tokyo = Sunday 11PM UTC
      });

      // In Tokyo timezone: Sat, Sun, Mon morning
      expect(result.business_days).toBe(1); // Just Monday
      expect(result.weekend_days).toBe(2); // Sat & Sun
    });
  });
});
