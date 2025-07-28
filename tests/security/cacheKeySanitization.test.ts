import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { cache } from '../../src/cache/timeCache';
import { getCurrentTime } from '../../src/tools/getCurrentTime';
import { convertTimezone } from '../../src/tools/convertTimezone';
import { calculateDuration } from '../../src/tools/calculateDuration';

describe('Cache Key Sanitization', () => {
  beforeEach(() => {
    cache.flushAll();
    jest.clearAllMocks();
  });

  describe('Cache key hashing', () => {
    it('should hash cache keys to prevent filesystem issues', () => {
      // Spy on cache.set to capture the actual cache key used
      const setSpy = jest.spyOn(cache, 'set');

      // Call with valid inputs that would be problematic as filenames
      getCurrentTime({
        timezone: 'America/New_York',
        format: 'yyyy-MM-dd HH:mm:ss',
      });

      expect(setSpy).toHaveBeenCalled();
      const actualKey = setSpy.mock.calls[0][0];

      // Should be a 64-char hex string (SHA-256)
      expect(actualKey).toMatch(/^[a-f0-9]{64}$/);
      expect(actualKey.length).toBe(64);
    });

    it('should generate different hashes for different inputs', () => {
      const setSpy = jest.spyOn(cache, 'set');

      // Two similar but different calls
      getCurrentTime({ timezone: 'America/New_York' });
      getCurrentTime({ timezone: 'America/Chicago' });

      const key1 = setSpy.mock.calls[0][0];
      const key2 = setSpy.mock.calls[1][0];

      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^[a-f0-9]{64}$/);
      expect(key2).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle filesystem-problematic characters in cache keys', () => {
      const setSpy = jest.spyOn(cache, 'set');

      // These are valid inputs but would be problematic as filesystem keys
      const inputs = [
        { timezone: 'America/New_York' }, // contains slashes
        { timezone: 'UTC', format: 'yyyy:MM:dd' }, // contains colons
        { timezone: 'Asia/Tokyo', format: 'HH mm ss' }, // contains spaces
      ];

      for (const input of inputs) {
        cache.flushAll();
        setSpy.mockClear();

        getCurrentTime(input);

        const actualKey = setSpy.mock.calls[0][0];
        // Should be hashed, not contain any problematic components
        expect(actualKey).toMatch(/^[a-f0-9]{64}$/);
        expect(actualKey).not.toContain('/');
        expect(actualKey).not.toContain(':');
        expect(actualKey).not.toContain(' ');
      }
    });

    it('should handle timezone strings with various valid characters', () => {
      const setSpy = jest.spyOn(cache, 'set');

      // Valid timezone examples with different character sets
      const timezoneInputs = [
        'America/New_York', // underscore
        'Europe/Paris', // slash
        'Asia/Tokyo', // slash
        'UTC', // simple
        'EST5EDT', // numbers
        'Etc/GMT+5', // plus sign
      ];

      for (const input of timezoneInputs) {
        cache.flushAll();
        setSpy.mockClear();

        getCurrentTime({ timezone: input });

        const actualKey = setSpy.mock.calls[0][0];
        expect(actualKey).toMatch(/^[a-f0-9]{64}$/);
        // Should not contain any of the original characters except hex
        expect(actualKey).not.toMatch(/[/_+\-A-Z]/);
      }
    });

    it('should handle long but valid format strings', () => {
      const setSpy = jest.spyOn(cache, 'set');

      // A valid but long format string (under 200 char limit)
      const longFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX '(' zzz ')' EEEE MMMM do";
      getCurrentTime({ format: longFormat });

      const actualKey = setSpy.mock.calls[0][0];
      // Should still be exactly 64 chars after hashing
      expect(actualKey).toMatch(/^[a-f0-9]{64}$/);
      expect(actualKey.length).toBe(64);
    });

    it('should handle all parameter combinations', () => {
      const setSpy = jest.spyOn(cache, 'set');

      // Complex but valid parameters
      getCurrentTime({
        timezone: 'America/New_York',
        format: 'yyyy-MM-dd HH:mm:ss zzz',
        include_offset: false,
      });

      const actualKey = setSpy.mock.calls[0][0];
      expect(actualKey).toMatch(/^[a-f0-9]{64}$/);
      // Original key would contain boolean, timezone, format - all hashed away
      expect(actualKey).not.toContain('America');
      expect(actualKey).not.toContain('false');
      expect(actualKey).not.toContain('yyyy');
    });

    it('should produce consistent hashes for the same input', () => {
      const setSpy = jest.spyOn(cache, 'set');

      // Same input twice
      getCurrentTime({ timezone: 'America/New_York', format: 'yyyy-MM-dd' });
      cache.flushAll();
      setSpy.mockClear();
      getCurrentTime({ timezone: 'America/New_York', format: 'yyyy-MM-dd' });

      const key1 = setSpy.mock.calls[0][0];
      setSpy.mockClear();

      // Third time
      cache.flushAll();
      getCurrentTime({ timezone: 'America/New_York', format: 'yyyy-MM-dd' });
      const key2 = setSpy.mock.calls[0][0];

      // Should produce identical hashes
      expect(key1).toBe(key2);
    });

    it('should work correctly with cache get operations', () => {
      const getSpy = jest.spyOn(cache, 'get');
      const setSpy = jest.spyOn(cache, 'set');

      // First call sets cache
      const result1 = getCurrentTime({ timezone: 'UTC' });
      const setKey = setSpy.mock.calls[0][0];

      // Second call should retrieve from cache
      const result2 = getCurrentTime({ timezone: 'UTC' });
      const getKey = getSpy.mock.calls[1][0]; // First call is in the function itself

      expect(setKey).toBe(getKey);
      expect(setKey).toMatch(/^[a-f0-9]{64}$/);
      expect(result1).toEqual(result2);
    });
  });

  describe('Cross-tool consistency', () => {
    it('should use the same hashing method across all tools', () => {
      const setSpy = jest.spyOn(cache, 'set');

      // Test that all tools produce valid hashed keys
      const tools = [
        () => getCurrentTime({ timezone: 'UTC' }),
        () => convertTimezone({ time: '2024-01-01', from_timezone: 'UTC', to_timezone: 'EST5EDT' }),
        () => calculateDuration({ start_time: '2024-01-01', end_time: '2024-01-02' }),
      ];

      for (const tool of tools) {
        cache.flushAll();
        setSpy.mockClear();

        tool();

        const actualKey = setSpy.mock.calls[0][0];
        expect(actualKey).toMatch(/^[a-f0-9]{64}$/);
      }
    });
  });

  describe('Performance considerations', () => {
    it('should hash keys efficiently', () => {
      const iterations = 1000;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        cache.flushAll();
        getCurrentTime({ timezone: 'UTC', format: 'yyyy-MM-dd' });
      }

      const duration = Date.now() - start;
      const perCall = duration / iterations;

      // Should be very fast - less than 1ms per call including the actual operation
      expect(perCall).toBeLessThan(1);
    });
  });
});
