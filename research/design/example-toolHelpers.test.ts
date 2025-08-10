import { getCachedResult, cacheResult, formatConvertedTime, handleConversionError } from '../../src/utils/toolHelpers';
import { cache, CacheTTL } from '../../src/cache/timeCache';
import { TimeServerErrorCodes } from '../../src/types';

// Mock the cache
jest.mock('../../src/cache/timeCache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  CacheTTL: {
    CURRENT_TIME: 1000,
    TIMEZONE_CONVERT: 300000,
    CALCULATIONS: 3600000,
  },
}));

// Mock date-fns-tz
jest.mock('date-fns-tz', () => ({
  formatInTimeZone: jest.fn().mockReturnValue('2021-01-01T00:00:00.000Z'),
}));

describe('Tool Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCachedResult', () => {
    it('should return cached value when available', () => {
      const mockResult = { value: 'test' };
      (cache.get as jest.Mock).mockReturnValue(mockResult);

      const result = getCachedResult<typeof mockResult>('test-key');

      expect(result).toEqual(mockResult);
      expect(cache.get).toHaveBeenCalledWith('test-key');
    });

    it('should return undefined when no cached value', () => {
      (cache.get as jest.Mock).mockReturnValue(undefined);

      const result = getCachedResult('test-key');

      expect(result).toBeUndefined();
      expect(cache.get).toHaveBeenCalledWith('test-key');
    });
  });

  describe('cacheResult', () => {
    it('should cache result with specified TTL', () => {
      const result = { value: 'test' };
      const cacheKey = 'test-key';
      const ttl = CacheTTL.TIMEZONE_CONVERT;

      cacheResult(cacheKey, result, ttl);

      expect(cache.set).toHaveBeenCalledWith(cacheKey, result, ttl);
    });
  });

  describe('formatConvertedTime', () => {
    it('should use custom format when provided', () => {
      const date = new Date('2021-01-01T00:00:00.000Z');
      const result = formatConvertedTime(
        date,
        'America/New_York',
        'yyyy-MM-dd',
        'yyyy-MM-dd HH:mm:ss'
      );

      expect(result).toBe('2021-01-01T00:00:00.000Z');
      const { formatInTimeZone } = require('date-fns-tz');
      expect(formatInTimeZone).toHaveBeenCalledWith(date, 'America/New_York', 'yyyy-MM-dd');
    });

    it('should use default format when custom not provided', () => {
      const date = new Date('2021-01-01T00:00:00.000Z');
      const result = formatConvertedTime(
        date,
        'America/New_York',
        undefined,
        'yyyy-MM-dd HH:mm:ss'
      );

      expect(result).toBe('2021-01-01T00:00:00.000Z');
      const { formatInTimeZone } = require('date-fns-tz');
      expect(formatInTimeZone).toHaveBeenCalledWith(date, 'America/New_York', 'yyyy-MM-dd HH:mm:ss');
    });
  });

  describe('handleConversionError', () => {
    it('should handle RangeError with proper error code', () => {
      const error = new RangeError('Invalid time value');
      
      expect(() => handleConversionError(error, 'yyyy-MM-dd')).toThrow();
      
      try {
        handleConversionError(error, 'yyyy-MM-dd');
      } catch (e: any) {
        expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_DATE_FORMAT);
        expect(e.error.message).toContain('Invalid format: Invalid time value');
        expect(e.error.details.format).toBe('yyyy-MM-dd');
      }
    });

    it('should handle Error with format in message', () => {
      const error = new Error('Invalid format string');
      
      expect(() => handleConversionError(error, 'bad-format')).toThrow();
      
      try {
        handleConversionError(error, 'bad-format');
      } catch (e: any) {
        expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_DATE_FORMAT);
        expect(e.error.message).toContain('Invalid format: Invalid format string');
      }
    });

    it('should re-throw unknown errors', () => {
      const error = new TypeError('Something went wrong');
      
      expect(() => handleConversionError(error, 'yyyy-MM-dd')).toThrow(error);
    });
  });
});