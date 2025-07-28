import { subtractTime } from '../../src/tools/subtractTime';
import { TimeServerErrorCodes } from '../../src/types';
import type { SubtractTimeResult } from '../../src/types';

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

describe('subtractTime', () => {
  const mockedCache = cache as jest.Mocked<typeof cache>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-07-18T17:30:00.000Z'));
    // Reset config mock to UTC default
    mockedGetConfig.mockReturnValue({ defaultTimezone: 'UTC' });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should subtract years from a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: 1,
        unit: 'years',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2024-01-15T10:30:00.000Z');
      expect(result.unix_original).toBe(1736937000);
      expect(result.unix_result).toBe(1705314600);
    });

    it('should subtract months from a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: 2,
        unit: 'months',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2024-11-15T10:30:00.000Z');
    });

    it('should subtract days from a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: 10,
        unit: 'days',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-05T10:30:00.000Z');
    });

    it('should subtract hours from a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: 5,
        unit: 'hours',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T05:30:00.000Z');
    });

    it('should subtract minutes from a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: 45,
        unit: 'minutes',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T09:45:00.000Z');
    });

    it('should subtract seconds from a date', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: 30,
        unit: 'seconds',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T10:29:30.000Z');
    });
  });

  describe('Timezone handling', () => {
    it('should handle timezone-aware subtraction', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T10:30:00',
        amount: 1,
        unit: 'days',
        timezone: 'America/New_York',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000-05:00');
      expect(result.result).toBe('2025-01-14T10:30:00.000-05:00');
    });

    it('should handle DST transitions when subtracting across boundaries', () => {
      mockedCache.get.mockReturnValue(null);

      // March 15 - 2 months crosses DST boundary
      const result = subtractTime({
        time: '2025-03-15T10:30:00Z',
        amount: 2,
        unit: 'months',
        timezone: 'UTC',
      });

      expect(result.original).toBe('2025-03-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T11:30:00.000Z'); // DST adjustment
    });

    it('should handle input with explicit timezone offset', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T12:00:00+05:30',
        amount: 1,
        unit: 'days',
        timezone: 'America/New_York', // Should be ignored
      });

      expect(result.original).toBe('2025-01-15T12:00:00.000+05:30');
      expect(result.result).toBe('2025-01-14T12:00:00.000+05:30');
    });

    it('should display result in requested timezone', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T10:00:00Z',
        amount: 5,
        unit: 'hours',
        timezone: 'Asia/Tokyo',
      });

      expect(result.original).toBe('2025-01-15T19:00:00.000+09:00');
      expect(result.result).toBe('2025-01-15T14:00:00.000+09:00');
    });
  });

  describe('Edge cases', () => {
    it('should handle negative amounts (addition)', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: -10,
        unit: 'days',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-25T10:30:00.000Z'); // Added 10 days
    });

    it('should handle month-end correctly', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-03-31T12:00:00Z',
        amount: 1,
        unit: 'months',
      });

      expect(result.original).toBe('2025-03-31T12:00:00.000Z');
      expect(result.result).toBe('2025-02-28T13:00:00.000Z'); // Feb 28, not Mar 3
    });

    it('should handle leap year correctly', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2024-02-29T12:00:00Z',
        amount: 1,
        unit: 'years',
      });

      expect(result.original).toBe('2024-02-29T12:00:00.000Z');
      expect(result.result).toBe('2023-02-28T12:00:00.000Z'); // Feb 28 in non-leap year
    });

    it('should handle date-only input', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15',
        amount: 1,
        unit: 'days',
        timezone: 'UTC',
      });

      expect(result.original).toBe('2025-01-15T00:00:00.000Z');
      expect(result.result).toBe('2025-01-14T00:00:00.000Z');
    });

    it('should handle Unix timestamp input', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '1736937000', // 2025-01-15T10:30:00Z
        amount: 1,
        unit: 'hours',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T09:30:00.000Z');
      expect(result.unix_result).toBe(1736933400);
    });

    it('should handle zero amount', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: 0,
        unit: 'days',
      });

      expect(result.original).toBe('2025-01-15T10:30:00.000Z');
      expect(result.result).toBe('2025-01-15T10:30:00.000Z');
      expect(result.unix_original).toBe(result.unix_result);
    });

    it('should handle year boundary crossing', () => {
      mockedCache.get.mockReturnValue(null);

      const result = subtractTime({
        time: '2025-01-05T10:30:00Z',
        amount: 10,
        unit: 'days',
      });

      expect(result.original).toBe('2025-01-05T10:30:00.000Z');
      expect(result.result).toBe('2024-12-26T10:30:00.000Z'); // Previous year
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid time format', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        subtractTime({
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
        subtractTime({
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
        subtractTime({
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
        subtractTime({
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
  });

  describe('Caching', () => {
    it('should cache results for 1 hour', () => {
      mockedCache.get.mockReturnValue(null);

      subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: 1,
        unit: 'days',
      });

      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]{64}$/),
        expect.any(Object),
        3600, // 1 hour
      );
    });

    it('should return cached result if available', () => {
      const cachedResult: SubtractTimeResult = {
        original: '2025-01-15T10:30:00.000Z',
        result: '2025-01-14T10:30:00.000Z',
        unix_original: 1736937000,
        unix_result: 1736850600,
      };
      mockedCache.get.mockReturnValue(cachedResult);

      const result = subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: 1,
        unit: 'days',
      });

      expect(result).toEqual(cachedResult);
      expect(mockedCache.set).not.toHaveBeenCalled();
    });

    it('should use system timezone in cache key when no timezone specified', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      subtractTime({
        time: '2025-01-15T10:30:00',
        amount: 2,
        unit: 'hours',
      });

      // Cache key should include the system timezone
      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]{64}$/),
        expect.any(Object),
        3600,
      );
    });

    it('should use different cache keys for different parameters', () => {
      mockedCache.get.mockReturnValue(null);

      subtractTime({
        time: '2025-01-15T10:30:00Z',
        amount: 1,
        unit: 'days',
      });

      subtractTime({
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

      const result = subtractTime({
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

      const result = subtractTime({
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

      const result = subtractTime({
        time: '2025-01-20T12:00:00',
        amount: 1,
        unit: 'hours',
      });

      // Should interpret input time as America/New_York time
      expect(result.original).toBe('2025-01-20T12:00:00.000-05:00');
      expect(result.result).toBe('2025-01-20T11:00:00.000-05:00');
    });

    it('should use explicit timezone parameter over system default', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = subtractTime({
        time: '2025-01-20T12:00:00',
        amount: 1,
        unit: 'hours',
        timezone: 'Asia/Tokyo',
      });

      // Should use Asia/Tokyo, not the system default
      expect(result.original).toBe('2025-01-20T12:00:00.000+09:00');
      expect(result.result).toBe('2025-01-20T11:00:00.000+09:00');
    });

    it('should use UTC when empty string timezone provided', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = subtractTime({
        time: '2025-01-20T12:00:00',
        amount: 1,
        unit: 'hours',
        timezone: '',
      });

      // Empty string should mean UTC for backward compatibility
      expect(result.original).toBe('2025-01-20T12:00:00.000Z');
      expect(result.result).toBe('2025-01-20T11:00:00.000Z');
    });
  });
});
