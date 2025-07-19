import { convertTimezone } from '../../src/tools/convertTimezone';
import { TimeServerErrorCodes } from '../../src/types';
import type { ConvertTimezoneResult } from '../../src/types';

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

describe('convertTimezone', () => {
  const mockedCache = cache as jest.Mocked<typeof cache>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-07-18T16:58:42.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should convert time from one timezone to another', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'America/New_York',
        to_timezone: 'Asia/Tokyo',
      });

      expect(result.original).toBe('2025-07-18T12:00:00.000-04:00');
      expect(result.converted).toBe('2025-07-19T01:00:00.000+09:00');
      expect(result.from_offset).toBe('-04:00');
      expect(result.to_offset).toBe('+09:00');
      expect(result.difference).toBe(780); // 13 hours in minutes
    });

    it('should handle UTC conversions', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'UTC',
        to_timezone: 'America/New_York',
      });

      expect(result.original).toBe('2025-07-18T12:00:00.000Z');
      expect(result.converted).toBe('2025-07-18T08:00:00.000-04:00');
      expect(result.from_offset).toBe('Z');
      expect(result.to_offset).toBe('-04:00');
      expect(result.difference).toBe(-240); // -4 hours
    });

    it('should use custom format when provided', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'America/New_York',
        to_timezone: 'Europe/London',
        format: 'yyyy-MM-dd HH:mm',
      });

      expect(result.converted).toBe('2025-07-18 17:00');
      // Original should still be in ISO format
      expect(result.original).toBe('2025-07-18T12:00:00.000-04:00');
    });

    it('should handle winter/summer time correctly', () => {
      mockedCache.get.mockReturnValue(null);

      // Winter time (EST)
      const winterResult = convertTimezone({
        time: '2025-01-15T09:00:00',
        from_timezone: 'America/New_York',
        to_timezone: 'UTC',
      });
      expect(winterResult.from_offset).toBe('-05:00'); // EST
      expect(winterResult.converted).toBe('2025-01-15T14:00:00.000Z');

      // Summer time (EDT)
      const summerResult = convertTimezone({
        time: '2025-07-15T09:00:00',
        from_timezone: 'America/New_York',
        to_timezone: 'UTC',
      });
      expect(summerResult.from_offset).toBe('-04:00'); // EDT
      expect(summerResult.converted).toBe('2025-07-15T13:00:00.000Z');
    });
  });

  describe('Input format handling', () => {
    it('should handle ISO8601 with Z', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '2025-07-18T12:00:00.000Z',
        from_timezone: 'UTC', // Should be ignored due to Z
        to_timezone: 'America/New_York',
      });

      expect(result.original).toBe('2025-07-18T12:00:00.000Z');
      expect(result.converted).toBe('2025-07-18T08:00:00.000-04:00');
    });

    it('should handle ISO8601 with offset', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '2025-07-18T12:00:00.000+05:30',
        from_timezone: 'America/New_York', // Should be ignored
        to_timezone: 'UTC',
      });

      // The offset in the input takes precedence
      expect(result.original).toBe('2025-07-18T12:00:00.000+05:30');
      expect(result.converted).toBe('2025-07-18T06:30:00.000Z');
      expect(result.from_offset).toBe('+05:30');
    });

    it('should handle date-only format', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '2025-07-18',
        from_timezone: 'America/New_York',
        to_timezone: 'UTC',
      });

      // Date-only is treated as midnight in from_timezone
      expect(result.original).toBe('2025-07-18T00:00:00.000-04:00');
      expect(result.converted).toBe('2025-07-18T04:00:00.000Z');
    });

    it('should handle Unix timestamps', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '1752857922', // 2025-07-18T16:58:42.000Z
        from_timezone: 'UTC', // Ignored for timestamps
        to_timezone: 'America/New_York',
      });

      expect(result.original).toBe('2025-07-18T16:58:42.000Z');
      expect(result.converted).toBe('2025-07-18T12:58:42.000-04:00');
    });
  });

  describe('Edge cases', () => {
    it('should handle same timezone conversion', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'America/New_York',
        to_timezone: 'America/New_York',
      });

      expect(result.original).toBe('2025-07-18T12:00:00.000-04:00');
      expect(result.converted).toBe('2025-07-18T12:00:00.000-04:00');
      expect(result.difference).toBe(0);
    });

    it('should handle timezone abbreviations', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'EST',
        to_timezone: 'PST',
      });

      expect(result.from_offset).toBe('-05:00'); // EST is always -5
      // PST in July would actually be PDT (-7), but PST as abbreviation should be -8
      // However, date-fns-tz might interpret PST contextually
      expect(result.to_offset).toMatch(/^-0[78]:00$/); // PST is -8, PDT is -7
      expect(Math.abs(result.difference)).toBeGreaterThanOrEqual(120); // At least 2 hours
    });

    it('should handle half-hour and 45-minute offset timezones', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'Asia/Kolkata', // +05:30
        to_timezone: 'Pacific/Chatham', // +12:45 (or +13:45 in DST)
      });

      expect(result.from_offset).toBe('+05:30');
      expect(result.to_offset).toMatch(/^\+1[23]:45$/); // Could be +12:45 or +13:45
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid from_timezone', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        convertTimezone({
          time: '2025-07-18T12:00:00',
          from_timezone: 'Invalid/Zone',
          to_timezone: 'UTC',
        }),
      ).toThrow();

      expect(() =>
        convertTimezone({
          time: '2025-07-18T12:00:00',
          from_timezone: 'Invalid/Zone',
          to_timezone: 'UTC',
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_TIMEZONE,
            message: 'Invalid from_timezone: Invalid/Zone',
            details: { timezone: 'Invalid/Zone', field: 'from_timezone' },
          },
        }),
      );
    });

    it('should throw error for invalid to_timezone', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        convertTimezone({
          time: '2025-07-18T12:00:00',
          from_timezone: 'UTC',
          to_timezone: 'Invalid/Zone',
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_TIMEZONE,
            message: 'Invalid to_timezone: Invalid/Zone',
            details: { timezone: 'Invalid/Zone', field: 'to_timezone' },
          },
        }),
      );
    });

    it('should throw error for invalid time format', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        convertTimezone({
          time: 'not-a-date',
          from_timezone: 'UTC',
          to_timezone: 'America/New_York',
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

    it('should throw error for invalid custom format', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        convertTimezone({
          time: '2025-07-18T12:00:00',
          from_timezone: 'UTC',
          to_timezone: 'America/New_York',
          format: 'invalid-format-$$$$',
        }),
      ).toThrowError(
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
    it('should cache results for 5 minutes', () => {
      mockedCache.get.mockReturnValue(null);

      convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'UTC',
        to_timezone: 'America/New_York',
      });

      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringContaining('convert_'),
        expect.any(Object),
        300, // 5 minutes
      );
    });

    it('should return cached result if available', () => {
      const cachedResult: ConvertTimezoneResult = {
        original: '2025-07-18T12:00:00.000Z',
        converted: '2025-07-18T08:00:00.000-04:00',
        from_offset: 'Z',
        to_offset: '-04:00',
        difference: -240,
      };
      mockedCache.get.mockReturnValue(cachedResult);

      const result = convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'UTC',
        to_timezone: 'America/New_York',
      });

      expect(result).toEqual(cachedResult);
      expect(mockedCache.set).not.toHaveBeenCalled();
    });

    it('should use different cache keys for different parameters', () => {
      mockedCache.get.mockReturnValue(null);

      convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'UTC',
        to_timezone: 'America/New_York',
      });

      convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'UTC',
        to_timezone: 'America/New_York',
        format: 'yyyy-MM-dd',
      });

      const calls = mockedCache.set.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]); // Different cache keys
    });
  });

  describe('Output format verification', () => {
    it('should always include all required fields', () => {
      mockedCache.get.mockReturnValue(null);

      const result = convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'America/Chicago',
        to_timezone: 'Australia/Sydney',
      });

      // All fields must be present
      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('converted');
      expect(result).toHaveProperty('from_offset');
      expect(result).toHaveProperty('to_offset');
      expect(result).toHaveProperty('difference');

      // Types should be correct
      expect(typeof result.original).toBe('string');
      expect(typeof result.converted).toBe('string');
      expect(typeof result.from_offset).toBe('string');
      expect(typeof result.to_offset).toBe('string');
      expect(typeof result.difference).toBe('number');
    });

    it('should calculate offset difference correctly', () => {
      mockedCache.get.mockReturnValue(null);

      // Test positive difference (east to west)
      const eastToWest = convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'Asia/Tokyo', // +09:00
        to_timezone: 'America/Los_Angeles', // -07:00
      });
      expect(eastToWest.difference).toBe(-960); // -16 hours

      // Test negative difference (west to east)
      const westToEast = convertTimezone({
        time: '2025-07-18T12:00:00',
        from_timezone: 'America/Los_Angeles', // -07:00
        to_timezone: 'Asia/Tokyo', // +09:00
      });
      expect(westToEast.difference).toBe(960); // +16 hours
    });
  });
});
