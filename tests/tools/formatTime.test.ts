import { formatTime } from '../../src/tools/formatTime';
import type { FormatTimeResult } from '../../src/types';

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

describe('formatTime', () => {
  const mockedCache = cache as jest.Mocked<typeof cache>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Set to Wednesday, Jan 15, 2025, 10:30:00 UTC
    jest.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
    // Reset config mock to UTC default
    mockedGetConfig.mockReturnValue({ defaultTimezone: 'UTC' });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Relative formatting', () => {
    it('should format future time relatively', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z', // 5 days in future
        format: 'relative',
      });

      expect(result.formatted).toBe('Monday at 2:30 PM');
      expect(result.original).toBe('2025-01-20T14:30:00.000Z');
    });

    it('should format past time relatively', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-10T08:00:00.000Z', // 5 days ago
        format: 'relative',
      });

      expect(result.formatted).toBe('last Friday at 8:00 AM');
    });

    it('should format same day time relatively', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-15T18:30:00.000Z', // Same day, later
        format: 'relative',
      });

      expect(result.formatted).toBe('today at 6:30 PM');
    });

    it('should format tomorrow relatively', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-16T10:30:00.000Z', // Tomorrow
        format: 'relative',
      });

      expect(result.formatted).toBe('tomorrow at 10:30 AM');
    });

    it('should format yesterday relatively', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-14T10:30:00.000Z', // Yesterday
        format: 'relative',
      });

      expect(result.formatted).toBe('yesterday at 10:30 AM');
    });

    it('should handle relative formatting with timezone', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'relative',
        timezone: 'America/New_York',
      });

      // Should still show relative format, timezone affects calculation
      expect(result.formatted).toMatch(/Monday at/);
    });
  });

  describe('Calendar formatting', () => {
    it('should format time in calendar style', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'calendar',
      });

      // Calendar format is same as relative
      expect(result.formatted).toBe('Monday at 2:30 PM');
    });

    it('should handle calendar format for past dates', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2024-12-25T12:00:00.000Z', // Christmas last year
        format: 'calendar',
      });

      // Older dates show date instead of relative
      expect(result.formatted).toMatch(/12\/25\/2024/);
    });
  });

  describe('Custom formatting', () => {
    it('should format with custom format string', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd',
      });

      expect(result.formatted).toBe('2025-01-20');
    });

    it('should support various custom formats', () => {
      mockedCache.get.mockReturnValue(undefined);

      const testCases = [
        { format: 'MM/dd/yyyy', expected: '01/20/2025' },
        { format: 'dd/MM/yyyy', expected: '20/01/2025' },
        { format: 'EEEE, MMMM do, yyyy', expected: 'Monday, January 20th, 2025' },
        { format: 'h:mm a', expected: '2:30 PM' },
        { format: 'HH:mm:ss', expected: '14:30:00' },
        { format: 'yyyy-MM-dd HH:mm:ss', expected: '2025-01-20 14:30:00' },
        { format: "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", expected: '2025-01-20T14:30:00.000Z' },
      ];

      testCases.forEach(({ format, expected }) => {
        const result = formatTime({
          time: '2025-01-20T14:30:00.000Z',
          format: 'custom',
          custom_format: format,
        });
        expect(result.formatted).toBe(expected);
      });
    });

    it('should handle custom format with timezone', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd HH:mm:ss zzz',
        timezone: 'Asia/Tokyo',
      });

      expect(result.formatted).toBe('2025-01-20 23:30:00 GMT+9');
    });

    it('should handle escaped text in custom format', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'custom',
        custom_format: "'Today is' EEEE 'at' h:mm a",
      });

      expect(result.formatted).toBe('Today is Monday at 2:30 PM');
    });
  });

  describe('Timezone handling', () => {
    it('should format in specified timezone', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd HH:mm:ss',
        timezone: 'America/New_York',
      });

      expect(result.formatted).toBe('2025-01-20 09:30:00');
    });

    it('should show correct timezone offset', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'custom',
        custom_format: 'XXX',
        timezone: 'Asia/Kolkata',
      });

      expect(result.formatted).toBe('+05:30');
    });

    it('should handle UTC timezone', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd HH:mm:ss XXX',
        timezone: 'UTC',
      });

      expect(result.formatted).toBe('2025-01-20 14:30:00 Z');
    });
  });

  describe('Input validation', () => {
    it('should handle various input time formats', () => {
      mockedCache.get.mockReturnValue(undefined);

      const inputs = [
        '2025-01-20T14:30:00.000Z',
        '2025-01-20T14:30:00Z',
        '2025-01-20T14:30:00+05:30',
        '2025-01-20',
      ];

      inputs.forEach((input) => {
        expect(() =>
          formatTime({
            time: input,
            format: 'relative',
          })
        ).not.toThrow();
      });
    });

    it('should handle unix timestamp', () => {
      mockedCache.get.mockReturnValue(undefined);

      const unixTime = Math.floor(new Date('2025-01-20T14:30:00.000Z').getTime() / 1000);
      const result = formatTime({
        time: unixTime.toString(),
        format: 'custom',
        custom_format: 'yyyy-MM-dd',
      });

      expect(result.formatted).toBe('2025-01-20');
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid format type', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        formatTime({
          time: '2025-01-20T14:30:00.000Z',
          format: 'invalid' as any,
        })
      ).toThrow();
      
      try {
        formatTime({
          time: '2025-01-20T14:30:00.000Z',
          format: 'invalid' as any,
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe(-32602); // ErrorCode.InvalidParams
        expect(error.message).toContain('Invalid');
        expect(error.data).toBeDefined();
      }
    });

    it('should throw error for missing custom_format when format is custom', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        formatTime({
          time: '2025-01-20T14:30:00.000Z',
          format: 'custom',
        })
      ).toThrow();
      
      try {
        formatTime({
          time: '2025-01-20T14:30:00.000Z',
          format: 'custom',
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe(-32602); // ErrorCode.InvalidParams
        expect(error.message).toContain('custom_format is required');
        expect(error.data).toBeDefined();
      }
    });

    it('should throw error for empty custom_format', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        formatTime({
          time: '2025-01-20T14:30:00.000Z',
          format: 'custom',
          custom_format: '',
        })
      ).toThrow();
      
      try {
        formatTime({
          time: '2025-01-20T14:30:00.000Z',
          format: 'custom',
          custom_format: '',
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe(-32602); // ErrorCode.InvalidParams
        expect(error.message).toContain('custom_format cannot be empty');
        expect(error.data).toBeDefined();
      }
    });

    it('should throw error for invalid time', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        formatTime({
          time: 'not-a-date',
          format: 'relative',
        })
      ).toThrow();
      
      try {
        formatTime({
          time: 'not-a-date',
          format: 'relative',
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe(-32602); // ErrorCode.InvalidParams
        expect(error.message).toContain('Invalid');
        expect(error.data).toBeDefined();
      }
    });

    it('should throw error for invalid timezone', () => {
      mockedCache.get.mockReturnValue(undefined);

      expect(() =>
        formatTime({
          time: '2025-01-20T14:30:00.000Z',
          format: 'relative',
          timezone: 'Invalid/Zone',
        })
      ).toThrow();
      
      try {
        formatTime({
          time: '2025-01-20T14:30:00.000Z',
          format: 'relative',
          timezone: 'Invalid/Zone',
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe(-32602); // ErrorCode.InvalidParams
        expect(error.message).toContain('Invalid timezone');
        expect(error.data).toBeDefined();
      }
    });
  });

  describe('Caching', () => {
    it('should cache results for 5 minutes', () => {
      mockedCache.get.mockReturnValue(undefined);

      formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'relative',
      });

      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]{64}$/),
        expect.any(Object),
        300 // 5 minutes
      );
    });

    it('should return cached result if available', () => {
      const cachedResult: FormatTimeResult = {
        formatted: 'Monday at 9:30 AM',
        original: '2025-01-20T14:30:00.000Z',
      };
      mockedCache.get.mockReturnValue(cachedResult);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'relative',
      });

      expect(result).toEqual(cachedResult);
      expect(mockedCache.set).not.toHaveBeenCalled();
    });

    it('should use different cache keys for different parameters', () => {
      mockedCache.get.mockReturnValue(undefined);

      formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'relative',
      });

      formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd',
      });

      formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'relative',
        timezone: 'America/New_York',
      });

      const calls = mockedCache.set.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]);
      expect(calls[1][0]).not.toBe(calls[2][0]);
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid date gracefully', () => {
      mockedCache.get.mockReturnValue(undefined);

      // Create an invalid date by parsing invalid string
      const result = formatTime({
        time: '2025-02-30T12:00:00.000Z', // Feb 30 doesn't exist
        format: 'custom',
        custom_format: 'yyyy-MM-dd',
      });

      // date-fns will parse this as March 2
      expect(result.formatted).toBe('2025-03-02');
    });

    it('should handle very old dates', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '1900-01-01T00:00:00.000Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd',
      });

      expect(result.formatted).toBe('1900-01-01'); // UTC format
    });

    it('should handle far future dates', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2100-12-31T23:59:59.000Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd HH:mm:ss',
      });

      expect(result.formatted).toBe('2100-12-31 23:59:59'); // UTC format
    });

    it('should format case-insensitively', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'RELATIVE' as any,
      });

      expect(result.formatted).toBe('Monday at 2:30 PM');
    });
  });

  describe('Response format', () => {
    it('should return all required fields', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'relative',
      });

      expect(result).toHaveProperty('formatted');
      expect(result).toHaveProperty('original');
      expect(typeof result.formatted).toBe('string');
      expect(typeof result.original).toBe('string');
    });

    it('should preserve original time in ISO format', () => {
      mockedCache.get.mockReturnValue(undefined);

      const result = formatTime({
        time: '2025-01-20T14:30:00+05:30',
        format: 'relative',
      });

      // Should convert to ISO8601 UTC
      expect(result.original).toBe('2025-01-20T09:00:00.000Z');
    });
  });

  describe('System timezone defaults', () => {
    it('should use system timezone when no timezone parameter provided', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'relative',
      });

      // Should format relative to NY time (9:30 AM EST)
      expect(result.formatted).toBe('Monday at 9:30 AM');
    });

    it('should still use UTC when empty string timezone provided (backward compatibility)', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'relative',
        timezone: '',
      });

      // Should use UTC, not system timezone (2:30 PM UTC)
      expect(result.formatted).toBe('Monday at 2:30 PM');
    });

    it('should use explicit timezone parameter over system default', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'relative',
        timezone: 'Asia/Tokyo',
      });

      // Should format relative to Tokyo time (11:30 PM JST)
      expect(result.formatted).toBe('Monday at 11:30 PM');
    });

    it('should apply system timezone for custom format', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd HH:mm:ss zzz',
      });

      // Should format in NY time (EST or GMT-5 are both acceptable)
      expect(result.formatted).toMatch(/2025-01-20 09:30:00 (EST|GMT-5)/);
    });

    it('should apply system timezone for calendar format', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = formatTime({
        time: '2025-01-15T20:30:00.000Z', // Same day but later in NY time
        format: 'calendar',
      });

      // Should format relative to NY time
      expect(result.formatted).toBe('today at 3:30 PM');
    });

    it('should handle system timezone in cache key', () => {
      mockedCache.get.mockReturnValue(undefined);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/Chicago' });

      formatTime({
        time: '2025-01-20T14:30:00.000Z',
        format: 'relative',
      });

      // Should include system timezone in cache key when no timezone provided
      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]{64}$/),
        expect.any(Object),
        300 // CacheTTL.TIMEZONE_CONVERT = 5 minutes
      );
    });
  });
});
