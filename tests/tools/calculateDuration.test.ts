import { calculateDuration } from '../../src/tools/calculateDuration';
import { TimeServerErrorCodes } from '../../src/types';
import type { CalculateDurationResult } from '../../src/types';

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

describe('calculateDuration', () => {
  const mockedCache = cache as jest.Mocked<typeof cache>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-07-18T18:00:00.000Z'));
    // Reset config mock to UTC default
    mockedGetConfig.mockReturnValue({ defaultTimezone: 'UTC' });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should calculate duration between two UTC times', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T14:30:00Z',
      });

      expect(result.milliseconds).toBe(16200000);
      expect(result.seconds).toBe(16200);
      expect(result.minutes).toBe(270);
      expect(result.hours).toBe(4.5);
      expect(result.days).toBe(0.1875);
      expect(result.formatted).toBe('4 hours 30 minutes');
      expect(result.is_negative).toBe(false);
    });

    it('should handle negative duration (end before start)', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T14:30:00Z',
        end_time: '2025-01-15T10:00:00Z',
      });

      expect(result.milliseconds).toBe(-16200000);
      expect(result.seconds).toBe(-16200);
      expect(result.minutes).toBe(-270);
      expect(result.hours).toBe(-4.5);
      expect(result.days).toBe(-0.1875);
      expect(result.formatted).toBe('-4 hours 30 minutes');
      expect(result.is_negative).toBe(true);
    });

    it('should handle zero duration (same times)', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T10:00:00Z',
      });

      expect(result.milliseconds).toBe(0);
      expect(result.seconds).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.days).toBe(0);
      expect(result.formatted).toBe('0 seconds');
      expect(result.is_negative).toBe(false);
    });

    it('should handle multi-day durations', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-17T14:30:45Z',
      });

      expect(result.days).toBe(2.1880208333333335); // ~2.19 days
      expect(result.hours).toBe(52.5125); // 52.5 hours
      expect(result.formatted).toBe('2 days 4 hours 30 minutes 45 seconds');
      expect(result.is_negative).toBe(false);
    });
  });

  describe('Timezone handling', () => {
    it('should handle times with explicit offsets', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00+05:30',
        end_time: '2025-01-15T10:00:00-05:00',
      });

      // 10:00 IST = 04:30 UTC, 10:00 EST = 15:00 UTC
      // Difference = 10.5 hours
      expect(result.hours).toBe(10.5);
      expect(result.minutes).toBe(630);
      expect(result.formatted).toBe('10 hours 30 minutes');
    });

    it('should handle timezone parameter for local times', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00',
        end_time: '2025-01-15T15:00:00',
        timezone: 'America/New_York',
      });

      // Both times interpreted as NY time
      expect(result.hours).toBe(5);
      expect(result.minutes).toBe(300);
      expect(result.formatted).toBe('5 hours');
    });

    it('should handle DST transitions correctly', () => {
      mockedCache.get.mockReturnValue(null);

      // Spring forward: 2 AM becomes 3 AM on March 9, 2025
      const result = calculateDuration({
        start_time: '2025-03-09T00:00:00',
        end_time: '2025-03-09T05:00:00',
        timezone: 'America/New_York',
      });

      // Wall clock shows 5 hours, but actual duration is 4 hours
      expect(result.hours).toBe(4);
      expect(result.formatted).toBe('4 hours');
    });

    it('should calculate duration when times have different timezone representations', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T05:00:00-05:00', // Same as 10:00 UTC
      });

      expect(result.milliseconds).toBe(0);
      expect(result.formatted).toBe('0 seconds');
    });
  });

  describe('Input format variations', () => {
    it('should handle date-only inputs', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15',
        end_time: '2025-01-16',
        timezone: 'UTC',
      });

      expect(result.days).toBe(1);
      expect(result.hours).toBe(24);
      expect(result.formatted).toBe('1 day');
    });

    it('should handle Unix timestamp strings', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '1736937000', // 2025-01-15T10:30:00Z
        end_time: '1736940600', // 2025-01-15T11:30:00Z
      });

      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(60);
      expect(result.formatted).toBe('1 hour');
    });

    it('should handle mixed input formats', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '1736937000', // Unix timestamp
        end_time: '2025-01-15T11:30:00Z', // ISO string
      });

      expect(result.hours).toBe(1);
      expect(result.formatted).toBe('1 hour');
    });
  });

  describe('Formatted output variations', () => {
    it('should format seconds only for durations under a minute', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T10:00:45Z',
      });

      expect(result.formatted).toBe('45 seconds');
    });

    it('should format minutes only for durations under an hour', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T10:45:00Z',
      });

      expect(result.formatted).toBe('45 minutes');
    });

    it('should format hours and minutes for durations under a day', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T12:30:00Z',
      });

      expect(result.formatted).toBe('2 hours 30 minutes');
    });

    it('should include all units for complex durations', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-20T14:35:25Z',
      });

      expect(result.formatted).toBe('5 days 4 hours 35 minutes 25 seconds');
    });

    it('should handle singular units correctly', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-16T11:01:01Z',
      });

      expect(result.formatted).toBe('1 day 1 hour 1 minute 1 second');
    });
  });

  describe('Unit parameter handling', () => {
    it('should return only requested unit when specified', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T14:30:00Z',
        unit: 'hours',
      });

      // Still returns all fields, but unit param might affect formatting
      expect(result.hours).toBe(4.5);
      expect(result.formatted).toBe('4.5 hours');
    });

    it('should handle "auto" unit (default behavior)', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T14:30:00Z',
        unit: 'auto',
      });

      expect(result.formatted).toBe('4 hours 30 minutes');
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid start time', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        calculateDuration({
          start_time: 'not-a-date',
          end_time: '2025-01-15T10:00:00Z',
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_DATE_FORMAT,
            message: expect.stringContaining('Invalid start_time format'),
            details: expect.objectContaining({ start_time: 'not-a-date' }),
          },
        }),
      );
    });

    it('should throw error for invalid end time', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        calculateDuration({
          start_time: '2025-01-15T10:00:00Z',
          end_time: 'not-a-date',
        }),
      ).toThrowError(
        expect.objectContaining({
          error: {
            code: TimeServerErrorCodes.INVALID_DATE_FORMAT,
            message: expect.stringContaining('Invalid end_time format'),
            details: expect.objectContaining({ end_time: 'not-a-date' }),
          },
        }),
      );
    });

    it('should throw error for invalid timezone', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        calculateDuration({
          start_time: '2025-01-15T10:00:00',
          end_time: '2025-01-15T14:00:00',
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

    it('should throw error for invalid unit parameter', () => {
      mockedCache.get.mockReturnValue(null);

      expect(() =>
        calculateDuration({
          start_time: '2025-01-15T10:00:00Z',
          end_time: '2025-01-15T14:00:00Z',
          unit: 'fortnights',
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
  });

  describe('Caching', () => {
    it('should cache results for 1 hour', () => {
      mockedCache.get.mockReturnValue(null);

      calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T14:00:00Z',
      });

      expect(mockedCache.set).toHaveBeenCalledWith(
        expect.stringContaining('duration_'),
        expect.any(Object),
        3600, // 1 hour
      );
    });

    it('should return cached result if available', () => {
      const cachedResult: CalculateDurationResult = {
        milliseconds: 14400000,
        seconds: 14400,
        minutes: 240,
        hours: 4,
        days: 0.16666666666666666,
        formatted: '4 hours',
        is_negative: false,
      };
      mockedCache.get.mockReturnValue(cachedResult);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T14:00:00Z',
      });

      expect(result).toEqual(cachedResult);
      expect(mockedCache.set).not.toHaveBeenCalled();
    });

    it('should use different cache keys for different parameters', () => {
      mockedCache.get.mockReturnValue(null);

      calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T14:00:00Z',
      });

      calculateDuration({
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T14:00:00Z',
        timezone: 'America/New_York',
      });

      const calls = mockedCache.set.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]); // Different cache keys
    });
  });

  describe('Edge cases', () => {
    it('should handle very large durations', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2020-01-01T00:00:00Z',
        end_time: '2025-12-31T23:59:59Z',
      });

      expect(result.days).toBeGreaterThan(2190); // ~6 years
      expect(result.formatted).toMatch(/^\d+ days/);
    });

    it('should handle millisecond precision', () => {
      mockedCache.get.mockReturnValue(null);

      const result = calculateDuration({
        start_time: '2025-01-15T10:00:00.000Z',
        end_time: '2025-01-15T10:00:00.123Z',
      });

      expect(result.milliseconds).toBe(123);
      expect(result.seconds).toBe(0.123);
      expect(result.formatted).toBe('0 seconds'); // Rounds down for display
    });
  });

  describe('System timezone defaults', () => {
    it('should use system timezone when no timezone parameter provided', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = calculateDuration({
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T15:00:00',
      });

      // Should interpret both times as America/New_York time
      expect(result.hours).toBe(5);
      expect(result.formatted).toBe('5 hours');
    });

    it('should use explicit timezone parameter over system default', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = calculateDuration({
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T15:00:00',
        timezone: 'Asia/Tokyo',
      });

      // Should use Asia/Tokyo, not the system default
      expect(result.hours).toBe(5);
      expect(result.formatted).toBe('5 hours');
    });

    it('should use UTC when empty string timezone provided', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      const result = calculateDuration({
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T15:00:00',
        timezone: '',
      });

      // Empty string should mean UTC for backward compatibility
      expect(result.hours).toBe(5);
      expect(result.formatted).toBe('5 hours');
    });

    it('should handle times across DST boundaries with system timezone', () => {
      mockedCache.get.mockReturnValue(null);
      mockedGetConfig.mockReturnValue({ defaultTimezone: 'America/New_York' });

      // Spring forward: 2AM becomes 3AM on March 9, 2025
      const result = calculateDuration({
        start_time: '2025-03-09T00:00:00',
        end_time: '2025-03-10T00:00:00',
      });

      // Should be 23 hours actual duration due to DST spring forward
      expect(result.hours).toBe(23);
      expect(result.formatted).toBe('23 hours');
    });
  });
});
