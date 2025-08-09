import { buildCacheKey } from '../../src/utils/cacheKeyBuilder';

describe('cacheKeyBuilder', () => {
  describe('buildCacheKey', () => {
    it('should create a simple key with prefix only', () => {
      const key = buildCacheKey('test');
      expect(key).toBe('test');
    });

    it('should handle single values', () => {
      const key = buildCacheKey('convert', {
        single: {
          time: '2025-01-01',
          timezone: 'UTC',
        },
      });
      expect(key).toBe('convert:time=2025-01-01:timezone=UTC');
    });

    it('should handle arrays by joining with commas', () => {
      const key = buildCacheKey('business', {
        arrays: {
          holidays: ['2025-01-01', '2025-12-25'],
          custom: [],
        },
      });
      // Note: keys are sorted alphabetically
      expect(key).toBe('business:custom=:holidays=2025-01-01,2025-12-25');
    });

    it('should handle boolean flags', () => {
      const key = buildCacheKey('calc', {
        flags: {
          excludeWeekends: true,
          includeObserved: false,
          optional: undefined,
        },
      });
      expect(key).toBe('calc:excludeWeekends=true:includeObserved=false:optional=false');
    });

    it('should handle optional values that might be undefined', () => {
      const key = buildCacheKey('format', {
        optional: {
          timezone: 'America/New_York',
          format: undefined,
          calendar: null,
        },
      });
      // Note: keys are sorted alphabetically, and timezone paths are URL-encoded
      expect(key).toBe('format:calendar=:format=:timezone=America%2FNew_York');
    });

    it('should handle dates array in a consistent format', () => {
      const key = buildCacheKey('range', {
        dates: ['2025-01-01', '2025-12-31'],
      });
      expect(key).toBe('range:dates=2025-01-01|2025-12-31');
    });

    it('should escape special characters in values', () => {
      const key = buildCacheKey('test', {
        single: {
          path: 'some:value:with:colons',
          query: 'a=b&c=d',
        },
      });
      expect(key).toBe('test:path=some%3Avalue%3Awith%3Acolons:query=a%3Db%26c%3Dd');
    });

    it('should maintain consistent key order for same inputs', () => {
      const key1 = buildCacheKey('test', {
        single: { b: '2', a: '1' },
      });
      const key2 = buildCacheKey('test', {
        single: { a: '1', b: '2' },
      });
      // Keys should be sorted alphabetically for consistency
      expect(key1).toBe('test:a=1:b=2');
      expect(key2).toBe('test:a=1:b=2');
      expect(key1).toBe(key2);
    });

    it('should handle complex business days key', () => {
      const key = buildCacheKey('business_days', {
        dates: ['2025-01-01', '2025-01-31'],
        flags: {
          excludeWeekends: true,
          includeObserved: true,
        },
        arrays: {
          holidays: ['2025-01-01', '2025-01-15'],
          custom_holidays: [],
        },
        optional: {
          timezone: 'America/New_York',
          holiday_calendar: 'US',
        },
      });

      expect(key).toContain('business_days');
      expect(key).toContain('dates=2025-01-01|2025-01-31');
      expect(key).toContain('excludeWeekends=true');
      expect(key).toContain('holidays=2025-01-01,2025-01-15');
      expect(key).toContain('timezone=America%2FNew_York'); // URL-encoded
    });

    it('should handle empty or null prefix gracefully', () => {
      const key1 = buildCacheKey('');
      expect(key1).toBe('');

      const key2 = buildCacheKey('', {
        single: { test: 'value' },
      });
      expect(key2).toBe('test=value');
    });

    it('should handle all option types together', () => {
      const key = buildCacheKey('complex', {
        single: { id: '123' },
        dates: ['2025-01-01'],
        flags: { active: true },
        arrays: { tags: ['a', 'b'] },
        optional: { note: 'test' },
      });

      // All parts should be present and ordered
      expect(key).toBe('complex:active=true:dates=2025-01-01:id=123:note=test:tags=a,b');
    });

    it('should be consistent with current withCache usage patterns', () => {
      // Test against actual current patterns from the codebase

      // Pattern from addTime.ts
      const addTimeKey = buildCacheKey('add', {
        single: {
          time: '2025-01-01',
          amount: '1',
          unit: 'day',
          timezone: 'UTC',
        },
      });
      expect(addTimeKey).toBe('add:amount=1:time=2025-01-01:timezone=UTC:unit=day');

      // Pattern from calculateDuration.ts
      const durationKey = buildCacheKey('duration', {
        single: {
          start_time: '2025-01-01',
          end_time: '2025-01-02',
          unit: 'hours',
          timezone: 'UTC',
        },
      });
      expect(durationKey).toContain('start_time=2025-01-01');
      expect(durationKey).toContain('end_time=2025-01-02');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined options object', () => {
      const key = buildCacheKey('test', undefined);
      expect(key).toBe('test');
    });

    it('should handle very long arrays efficiently', () => {
      const longArray = Array.from({ length: 100 }, (_, i) => `item${i}`);
      const key = buildCacheKey('test', {
        arrays: { items: longArray },
      });
      expect(key).toContain('items=item0,item1');
      expect(key.length).toBeLessThan(2000); // Should not create excessively long keys
    });

    it('should handle special timezone formats', () => {
      const key = buildCacheKey('tz', {
        single: {
          timezone: 'America/Argentina/Buenos_Aires',
        },
      });
      expect(key).toBe('tz:timezone=America%2FArgentina%2FBuenos_Aires');
    });
  });
});
