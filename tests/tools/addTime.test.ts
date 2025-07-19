import { addTime } from '../../src/tools/addTime';
import { TimeServerErrorCodes } from '../../src/types';
import type { AddTimeResult } from '../../src/types';

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

describe('addTime', () => {
  const mockedCache = cache as jest.Mocked<typeof cache>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-07-18T16:58:42.000Z'));
    // Reset config mock to UTC default
    mockedGetConfig.mockReturnValue({ defaultTimezone: 'UTC' });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should add years to a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 1,
        unit: 'years',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2026-01-15T10:30:00.000Z');
      expect(result.unix_original).toBe(1736937000);
      expect(result.unix_result).toBe(1768473000);
    });

    it('should add months to a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 2,
        unit: 'months',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-03-15T09:30:00.000Z'); // DST adjustment
    });

    it('should add days to a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 10,
        unit: 'days',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-25T10:30:00.000Z');
    });

    it('should add hours to a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 5,
        unit: 'hours',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T15:30:00.000Z');
    });

    it('should add minutes to a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 45,
        unit: 'minutes',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T11:15:00.000Z');
    });

    it('should add seconds to a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 30,
        unit: 'seconds',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T10:30:30.000Z');
    });
  });

  describe('Timezone handling', () => {
    it('should handle timezone-aware addition', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00',
        amount: 1,
        unit: 'days',
        timezone: 'America/New_York',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000-05:00');
      expect(result.result).toBe('2025-01-16T10:30:00.000-05:00');
    });

    it('should handle DST transitions when adding hours', () => {
      mockedCache.get.mockReturnValue(null);

      // Spring forward: 2 AM becomes 3 AM on March 9, 2025
      const result = addTime({
        time: '2025-03-09T01:00:00',
        amount: 2,
        unit: 'hours',
        timezone: 'America/New_York',
      });

      // 1 AM + 2 hours = 4 AM (because 2 AM doesn't exist)
      expect(result.original).toBe('2025-03-09T01:00:00.000-05:00');
      expect(result.result).toBe('2025-03-09T04:00:00.000-04:00');
    });

    it('should handle input with explicit timezone offset', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T12:00:00+05:30',
        amount: 1,
        unit: 'days',
        timezone: 'America/New_York', // Should be ignored
      });

      expect(result.original).toBe('2025-01-15T12:00:00.000+05:30');
      expect(result.result).toBe('2025-01-16T12:00:00.000+05:30');
    });

    it('should handle input with uncommon offset', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T12:00:00-03:00',
        amount: 2,
        unit: 'hours',
      });

      expect(result.original).toBe('2025-01-15T12:00:00.000-03:00');
      expect(result.result).toBe('2025-01-15T14:00:00.000-03:00');
    });

    it('should display result in requested timezone', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:00:00Z',
        amount: 5,
        unit: 'hours',
        timezone: 'Asia/Tokyo',
      });

      expect(result.original).toBe('2025-01-15T19:00:00.000+09:00');
      expect(result.result).toBe('2025-01-16T00:00:00.000+09:00'); // Midnight next day
    });
  });

  describe('Edge cases', () => {
    it('should handle negative amounts (subtraction)', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00Z',
        amount: -10,
        unit: 'days',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-05T10:30:00.000Z');
    });

    it('should handle month-end correctly', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-31T12:00:00Z',
        amount: 1,
        unit: 'months',
      });

      expect(result.original).toBe('2025-01-31T12:00:00.000Z');
      expect(result.result).toBe('2025-02-28T12:00:00.000Z'); // Not March 3rd
    });

    it('should handle leap year correctly', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2024-02-29T12:00:00Z',
        amount: 1,
        unit: 'years',
      });

      expect(result.original).toBe('2024-02-29T12:00:00.000Z');
      expect(result.result).toBe('2025-02-28T12:00:00.000Z'); // Feb 28 in non-leap year
    });

    it('should handle date-only input', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15',
        amount: 1,
        unit: 'days',
        timezone: 'UTC',
      });

      expect(result.original).toBe('2025-01-15T00:00:00.000Z');
      expect(result.result).toBe('2025-01-16T00:00:00.000Z');
    });

    it('should handle Unix timestamp input', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '1736937000', // 2025-01-15T10:30:00Z
        amount: 1,
        unit: 'hours',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T11:30:00.000Z');
      expect(result.unix_result).toBe(1736940600);
    });

    it('should handle Unix timestamp with timezone', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '1736937000', // 2025-01-15T10:30:00Z
        amount: 1,
        unit: 'hours',
        timezone: 'America/New_York',
      });

      expect(result.original).toBe('2025-01-15T05:30:00.000-05:00');
      expect(result.result).toBe('2025-01-15T06:30:00.000-05:00');
    });

    it('should handle zero amount', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 0,
        unit: 'days',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T10:30:00.000Z');
      expect(result.unix_original).toBe(result.unix_result);
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid time format', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        addTime({
          time: 'not-a-date',
          amount: 1,
          unit: 'days',
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_DATE_FORMAT,
            message: expect.stringContaining('Invalid time format'),
            details: expect.objectContaining({ time: 'not-a-date' }),
          },
        }),
      );
    });

    it('should throw error for invalid unit', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        addTime({
          time: '2025-01-15T10:30:00Z',
          amount: 1,
          unit: 'fortnights' as any,
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: expect.stringContaining('Invalid unit'),
            details: expect.objectContaining({ unit: 'fortnights' }),
          },
        }),
      );
    });

    it('should throw error for invalid timezone', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        addTime({
          time: '2025-01-15T10:30:00',
          amount: 1,
          unit: 'days',
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

    it('should throw error for NaN amount', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        addTime({
          time: '2025-01-15T10:30:00Z',
          amount: NaN,
          unit: 'days',
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: expect.stringContaining('Invalid amount'),
            details: expect.objectContaining({ amount: NaN }),
          },
        }),
      );
    });

    it('should throw error for Infinity amount', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        addTime({
          time: '2025-01-15T10:30:00Z',
          amount: Infinity,
          unit: 'days',
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_PARAMETER,
            message: expect.stringContaining('Invalid amount'),
            details: expect.objectContaining({ amount: Infinity }),
          },
        }),
      );
    });
  });

  describe('Caching', () => {
    it('should cache results for 1 hour', () => {
      mockedCache.get.mockReturnValue(null);

      addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 1,
        unit: 'days',
      });

      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringContaining('add_'),
        expect.any(Object),
        3600, // 1 hour
      );
    });

    it('should return cached result if available', () => {
      const cachedResult: AddTimeResult = {
        original: '2025-01-15T10:30:00.000Z',
        result: '2025-01-16T10:30:00.000Z',
        unix_original: 1737109800,
        unix_result: 1737196200,
      };
      mockedCache.get.mockReturnValue(cachedResult);

      const result = addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 1,
        unit: 'days',
      });

      expect(result).toEqual(cachedResult);
      expect(mockedCache.set).not.toHaveBeenCalled();
    });

    it('should use different cache keys for different parameters', () => {
      mockedCache.get.mockReturnValue(null);

      addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 1,
        unit: 'days',
      });

      addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 1,
        unit: 'days',
        timezone: 'America/New_York',
      });

      const calls = mockedCache.set.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]); // Different cache keys
    });
  });

  describe('Output format verification', () => {
    it('should always include all required fields', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00Z',
        amount: 1,
        unit: 'hours',
      });

      // All fields must be present
      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('unix_original');
      expect(result).toHaveProperty('unix_result');

      // Types should be correct
      expect(typeof result.original).toBe('string');
      expect(typeof result.result).toBe('string');
      expect(typeof result.unix_original).toBe('number');
      expect(typeof result.unix_result).toBe('number');
    });

    it('should format times consistently with milliseconds', () => {
      mockedCache.get.mockReturnValue(null);

      const result = addTime({
        time: '2025-01-15T10:30:00',
        amount: 1,
        unit: 'days',
        timezone: 'America/New_York',
      });

      // Should have .000 milliseconds format
      expect(result.original).toMatch(/\.\d{3}/);
      expect(result.result).toMatch(/\.\d{3}/);
    });
  });

  describe('System timezone defaults', () => {
    it('should use system timezone when no timezone parameter provided', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = addTime({
        time: '2025-01-20T12:00:00',
        amount: 1,
        unit: 'hours',
      });

      // Should interpret input time as America/New_York time
      expect(result.original).toBe('2025-01-20T12:00:00.000-05:00');
      expect(result.result).toBe('2025-01-20T13:00:00.000-05:00');
    });

    it('should use explicit timezone parameter over system default', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = addTime({
        time: '2025-01-20T12:00:00',
        amount: 1,
        unit: 'hours',
        timezone: 'Asia/Tokyo',
      });

      // Should use Asia/Tokyo, not the system default
      expect(result.original).toBe('2025-01-20T12:00:00.000+09:00');
      expect(result.result).toBe('2025-01-20T13:00:00.000+09:00');
    });

    it('should use UTC when empty string timezone provided', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = addTime({
        time: '2025-01-20T12:00:00',
        amount: 1,
        unit: 'hours',
        timezone: '',
      });

      // Empty string should mean UTC for backward compatibility
      expect(result.original).toBe('2025-01-20T12:00:00.000Z');
      expect(result.result).toBe('2025-01-20T13:00:00.000Z');
    });
  });
});
