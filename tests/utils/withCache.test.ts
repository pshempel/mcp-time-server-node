import { withCache, withCacheAsync } from '../../src/utils/withCache';
import { cache } from '../../src/cache/timeCache';
import { hashCacheKey } from '../../src/cache/cacheKeyHash';
import { debug } from '../../src/utils/debug';

// Mock the cache modules
jest.mock('../../src/cache/timeCache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  CacheTTL: {
    CALCULATIONS: 3600,
    CURRENT_TIME: 1,
  },
}));

jest.mock('../../src/cache/cacheKeyHash', () => ({
  hashCacheKey: jest.fn((key: string) => `hashed_${key}`),
}));

describe('withCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cache hit scenarios', () => {
    it('should return cached value when present', () => {
      const cachedValue = { result: 'cached', timestamp: 12345 };
      (cache.get as jest.Mock).mockReturnValue(cachedValue);

      const compute = jest.fn(() => ({ result: 'computed', timestamp: 67890 }));

      const result = withCache('test_key', 3600, compute);

      expect(result).toEqual(cachedValue);
      expect(compute).not.toHaveBeenCalled();
      expect(cache.get).toHaveBeenCalledWith('hashed_test_key');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('should handle falsy cached values correctly', () => {
      // Test that 0, false, null are returned from cache
      const falsyValues = [0, false, null, ''];

      falsyValues.forEach((value) => {
        jest.clearAllMocks();
        (cache.get as jest.Mock).mockReturnValue(value);

        const compute = jest.fn(() => 'should not be called');

        const result = withCache('falsy_key', 3600, compute);

        expect(result).toBe(value);
        expect(compute).not.toHaveBeenCalled();
      });
    });
  });

  describe('cache miss scenarios', () => {
    it('should compute and cache value when not present', () => {
      (cache.get as jest.Mock).mockReturnValue(undefined);

      const computedValue = { result: 'computed', timestamp: 67890 };
      const compute = jest.fn(() => computedValue);

      const result = withCache('miss_key', 3600, compute);

      expect(result).toEqual(computedValue);
      expect(compute).toHaveBeenCalledTimes(1);
      expect(cache.get).toHaveBeenCalledWith('hashed_miss_key');
      expect(cache.set).toHaveBeenCalledWith('hashed_miss_key', computedValue, 3600);
    });

    it('should only compute once even if called multiple times synchronously', () => {
      // This tests that the compute function is memoized during execution
      (cache.get as jest.Mock).mockReturnValue(undefined);

      let computeCount = 0;
      const compute = jest.fn(() => {
        computeCount++;
        return { count: computeCount };
      });

      const result1 = withCache('sync_key', 3600, compute);

      // Second call should get from cache (that we just set)
      (cache.get as jest.Mock).mockReturnValue(result1);
      const result2 = withCache('sync_key', 3600, compute);

      expect(compute).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ count: 1 });
      expect(result2).toEqual({ count: 1 });
    });
  });

  describe('type safety', () => {
    it('should preserve type information', () => {
      interface TestResult {
        name: string;
        value: number;
        nested: {
          flag: boolean;
        };
      }

      const typedResult: TestResult = {
        name: 'test',
        value: 42,
        nested: { flag: true },
      };

      (cache.get as jest.Mock).mockReturnValue(undefined);

      const result = withCache<TestResult>('typed_key', 3600, () => typedResult);

      // TypeScript should recognize these properties
      expect(result.name).toBe('test');
      expect(result.value).toBe(42);
      expect(result.nested.flag).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from compute function', () => {
      (cache.get as jest.Mock).mockReturnValue(undefined);

      const compute = jest.fn(() => {
        throw new Error('Computation failed');
      });

      expect(() => withCache('error_key', 3600, compute)).toThrow('Computation failed');

      // Should not cache errors
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('should handle cache.get errors gracefully', () => {
      (cache.get as jest.Mock).mockImplementation(() => {
        throw new Error('Cache read failed');
      });

      const compute = jest.fn(() => 'fallback');

      // Should fall back to computing
      const result = withCache('cache_error_key', 3600, compute);

      expect(result).toBe('fallback');
      expect(compute).toHaveBeenCalled();
    });

    it('should handle cache.set errors gracefully', () => {
      (cache.get as jest.Mock).mockReturnValue(undefined);
      (cache.set as jest.Mock).mockImplementation(() => {
        throw new Error('Cache write failed');
      });

      const compute = jest.fn(() => 'computed_value');

      // Should return computed value even if cache write fails
      const result = withCache('write_error_key', 3600, compute);

      expect(result).toBe('computed_value');
      expect(compute).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });
  });

  describe('cache key handling', () => {
    it('should hash the cache key', () => {
      (cache.get as jest.Mock).mockReturnValue(undefined);

      withCache('raw_key', 3600, () => 'value');

      expect(hashCacheKey).toHaveBeenCalledWith('raw_key');
      expect(cache.get).toHaveBeenCalledWith('hashed_raw_key');
      expect(cache.set).toHaveBeenCalledWith('hashed_raw_key', 'value', 3600);
    });

    it('should handle complex cache keys', () => {
      const complexKey = 'add_2025-01-15T10:00:00Z_5_days_America/New_York';
      (cache.get as jest.Mock).mockReturnValue(undefined);

      withCache(complexKey, 3600, () => 'value');

      expect(hashCacheKey).toHaveBeenCalledWith(complexKey);
    });

    it('should log debug info for long cache keys when debug is enabled', () => {
      const longKey = 'a'.repeat(25); // More than 20 chars
      (cache.get as jest.Mock).mockReturnValue(undefined);

      // Enable debug.cache to trigger the logging path
      const originalEnabled = debug.cache.enabled;
      debug.cache.enabled = true;

      withCache(longKey, 3600, () => 'value');

      // Restore original state
      debug.cache.enabled = originalEnabled;

      expect(hashCacheKey).toHaveBeenCalledWith(longKey);
      // The debug logging happens internally when enabled and key > 20 chars
    });
  });

  describe('TTL handling', () => {
    it('should pass TTL to cache.set', () => {
      (cache.get as jest.Mock).mockReturnValue(undefined);

      const ttlValues = [1, 300, 3600, 86400];

      ttlValues.forEach((ttl) => {
        jest.clearAllMocks();
        (cache.get as jest.Mock).mockReturnValue(undefined);

        withCache(`ttl_key_${ttl}`, ttl, () => `value_${ttl}`);

        expect(cache.set).toHaveBeenCalledWith(`hashed_ttl_key_${ttl}`, `value_${ttl}`, ttl);
      });
    });
  });
});

describe('withCacheAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cached value when present', async () => {
    const cachedValue = { result: 'cached', timestamp: 12345 };
    (cache.get as jest.Mock).mockReturnValue(cachedValue);

    const compute = jest.fn(async () => ({ result: 'computed', timestamp: 67890 }));

    const result = await withCacheAsync('test_key', 3600, compute);

    expect(result).toEqual(cachedValue);
    expect(compute).not.toHaveBeenCalled();
    expect(cache.get).toHaveBeenCalledWith('hashed_test_key');
  });

  it('should compute and cache value when not present', async () => {
    (cache.get as jest.Mock).mockReturnValue(undefined);

    const computedValue = { result: 'computed', timestamp: 67890 };
    const compute = jest.fn(async () => computedValue);

    const result = await withCacheAsync('miss_key', 3600, compute);

    expect(result).toEqual(computedValue);
    expect(compute).toHaveBeenCalledTimes(1);
    expect(cache.get).toHaveBeenCalledWith('hashed_miss_key');
    expect(cache.set).toHaveBeenCalledWith('hashed_miss_key', computedValue, 3600);
  });

  it('should handle cache.set errors gracefully', async () => {
    (cache.get as jest.Mock).mockReturnValue(undefined);
    (cache.set as jest.Mock).mockImplementation(() => {
      throw new Error('Cache write failed');
    });

    const compute = jest.fn(async () => 'computed_value');

    // Should return computed value even if cache write fails
    const result = await withCacheAsync('write_error_key', 3600, compute);

    expect(result).toBe('computed_value');
    expect(compute).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalled();
  });

  it('should handle async compute errors', async () => {
    (cache.get as jest.Mock).mockReturnValue(undefined);

    const compute = jest.fn(async () => {
      throw new Error('Async computation failed');
    });

    await expect(withCacheAsync('error_key', 3600, compute)).rejects.toThrow(
      'Async computation failed'
    );

    // Should not cache errors
    expect(cache.set).not.toHaveBeenCalled();
  });
});
