import { getCurrentTime } from '../../src/tools/getCurrentTime';
import { TimeServerErrorCodes } from '../../src/types';
import type { GetCurrentTimeResult, GetCurrentTimeParams } from '../../src/types';

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

describe('getCurrentTime', () => {
  const mockedCache = cache as jest.Mocked<typeof cache>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date constructor and Date.now() for consistent testing
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
    it('should return current time in UTC by default', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getCurrentTime({});

      expect(result.timezone).toBe('UTC');
      expect(result.time).toMatch(/^2025-07-18T16:58:42\.000Z$/);
      expect(result.offset).toBe('Z');
      expect(result.unix).toBe(1752857922);
      expect(result.iso).toMatch(/^2025-07-18T16:58:42/);
    });

    it('should handle specific timezone', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getCurrentTime({ timezone: 'America/New_York' });

      expect(result.timezone).toBe('America/New_York');
      // In July, NY is EDT (UTC-4)
      expect(result.time).toMatch(/^2025-07-18T12:58:42\.000-04:00$/);
      expect(result.offset).toBe('-04:00');
      expect(result.unix).toBe(1752857922);
    });

    it('should handle custom format', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getCurrentTime({
        timezone: 'Europe/London',
        format: 'yyyy-MM-dd HH:mm:ss',
      });

      expect(result.time).toBe('2025-07-18 17:58:42');
      expect(result.timezone).toBe('Europe/London');
      // London is BST (UTC+1) in July
      expect(result.offset).toBe('+01:00');
    });

    it('should handle include_offset=false', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getCurrentTime({
        timezone: 'Asia/Tokyo',
        format: 'yyyy-MM-dd HH:mm:ss',
        include_offset: false,
      });

      // Should not include offset in formatted time
      expect(result.time).toBe('2025-07-19 01:58:42');
      // But offset should still be in the result object
      expect(result.offset).toBe('+09:00');
    });
  });

  describe('Edge cases', () => {
    it('should treat empty string timezone as UTC', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getCurrentTime({ timezone: '' });

      expect(result.timezone).toBe('UTC');
      expect(result.offset).toBe('Z');
    });

    it('should handle timezone abbreviations', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getCurrentTime({ timezone: 'EST' });

      expect(result.timezone).toBe('EST');
      // EST is always UTC-5 (no DST)
      expect(result.offset).toBe('-05:00');
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid timezone', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() => getCurrentTime({ timezone: 'Invalid/Zone' })).toThrow();
      expect(() => getCurrentTime({ timezone: 'Invalid/Zone' })).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_TIMEZONE,
            message: 'Invalid timezone: Invalid/Zone',
            details: { timezone: 'Invalid/Zone' },
          },
        }),
      );
    });

    it('should throw error for invalid format pattern', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() => getCurrentTime({ format: 'invalid-format-$$$$' })).toThrow();
      expect(() => getCurrentTime({ format: 'invalid-format-$$$$' })).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_DATE_FORMAT,
            message: expect.stringContaining('Invalid format'),
            details: expect.objectContaining({ format: 'invalid-format-$$$$' }),
          },
        }),
      );
    });
  });

  describe('Caching', () => {
    it('should cache results for 1 second', () => {
      mockedCache.get.mockReturnValue(null);

      const params: GetCurrentTimeParams = { timezone: 'America/Chicago' };
      getCurrentTime(params);

      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringContaining('current_America/Chicago'),
        expect.any(Object),
        1,
      );
    });

    it('should return cached result if available', () => {
      const cachedResult: GetCurrentTimeResult = {
        time: '2025-07-18T11:58:42.000-05:00',
        timezone: 'America/Chicago',
        offset: '-05:00',
        unix: 1752857922,
        iso: '2025-07-18T11:58:42.000-05:00',
      };
      mockedCache.get.mockReturnValue(cachedResult);

      const result = getCurrentTime({ timezone: 'America/Chicago' });

      expect(result).toEqual(cachedResult);
      expect(mockedCache.set).not.toHaveBeenCalled();
    });

    it('should use different cache keys for different parameters', () => {
      mockedCache.get.mockReturnValue(null);

      getCurrentTime({ timezone: 'UTC' });
      getCurrentTime({ timezone: 'UTC', format: 'yyyy-MM-dd' });

      const calls = mockedCache.set.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]); // Different cache keys
    });
  });

  describe('System timezone defaults', () => {
    it('should use system timezone when no timezone parameter provided', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = getCurrentTime({});

      expect(result.timezone).toBe('America/New_York');
      expect(result.offset).toBe('-04:00'); // EDT in July
    });

    it('should still use UTC when empty string timezone provided (backward compatibility)', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = getCurrentTime({ timezone: '' });

      expect(result.timezone).toBe('UTC');
      expect(result.offset).toBe('Z');
    });

    it('should use explicit timezone parameter over system default', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = getCurrentTime({ timezone: 'Asia/Tokyo' });

      expect(result.timezone).toBe('Asia/Tokyo');
      expect(result.offset).toBe('+09:00');
    });
  });

  describe('Output format verification', () => {
    it('should always include all required fields', () => {
      mockedCache.get.mockReturnValue(null);

      const result = getCurrentTime({
        timezone: 'Pacific/Auckland',
        format: 'dd/MM/yyyy',
      });

      // All fields must be present
      expect(result).toHaveProperty('time');
      expect(result).toHaveProperty('timezone');
      expect(result).toHaveProperty('offset');
      expect(result).toHaveProperty('unix');
      expect(result).toHaveProperty('iso');

      // Types should be correct
      expect(typeof result.time).toBe('string');
      expect(typeof result.timezone).toBe('string');
      expect(typeof result.offset).toBe('string');
      expect(typeof result.unix).toBe('number');
      expect(typeof result.iso).toBe('string');
    });

    it('should format offset correctly for various timezones', () => {
      mockedCache.get.mockReturnValue(null);

      const timezones = [
        { tz: 'UTC', expectedOffset: 'Z' },
        { tz: 'America/New_York', expectedOffset: '-04:00' }, // EDT in July
        { tz: 'Asia/Kolkata', expectedOffset: '+05:30' }, // Half-hour offset
        { tz: 'Pacific/Chatham', expectedOffset: '+12:45' }, // 45-minute offset
      ];

      for (const { tz, expectedOffset } of timezones) {
        const result = getCurrentTime({ timezone: tz });
        expect(result.offset).toBe(expectedOffset);
      }
    });
  });
});
