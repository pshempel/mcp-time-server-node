import { MemoryAwareCache } from '../../src/cache/memoryAwareCache';

describe('MemoryAwareCache', () => {
  let cache: MemoryAwareCache;

  beforeEach(() => {
    cache = new MemoryAwareCache({
      maxMemory: 1024, // 1KB for testing
      stdTTL: 0, // No expiry
      checkperiod: 0, // No automatic deletion
    });
  });

  afterEach(() => {
    cache.close();
  });

  describe('constructor', () => {
    it('should create cache with default 10MB limit', () => {
      const defaultCache = new MemoryAwareCache();
      expect(defaultCache.getMemoryStats().maxMemory).toBe(10 * 1024 * 1024);
    });

    it('should accept custom memory limit', () => {
      expect(cache.getMemoryStats().maxMemory).toBe(1024);
    });
  });

  describe('memory tracking', () => {
    it('should track memory usage when adding entries', () => {
      const stats = cache.getMemoryStats();
      expect(stats.usedMemory).toBe(0);
      expect(stats.availableMemory).toBe(1024);

      cache.set('key1', { data: 'test' });

      const newStats = cache.getMemoryStats();
      expect(newStats.usedMemory).toBeGreaterThan(0);
      expect(newStats.availableMemory).toBeLessThan(1024);
    });

    it('should calculate object size consistently', () => {
      const testObj = { time: '2025-01-01T00:00:00Z', timezone: 'UTC' };
      cache.set('test', testObj);

      const size1 = cache.getMemoryStats().usedMemory;

      // Same object should use same memory
      cache.del('test');
      cache.set('test', testObj);

      const size2 = cache.getMemoryStats().usedMemory;
      expect(size2).toBe(size1);
    });

    it('should reduce memory usage when deleting entries', () => {
      cache.set('key1', { data: 'test' });
      const afterAdd = cache.getMemoryStats().usedMemory;
      expect(afterAdd).toBeGreaterThan(0);

      cache.del('key1');
      const afterDel = cache.getMemoryStats().usedMemory;

      expect(afterDel).toBe(0);
    });
  });

  describe('memory limits', () => {
    it('should reject set when memory limit would be exceeded', () => {
      // Fill cache near limit (650 chars = ~871 bytes)
      cache.set('big', { data: 'x'.repeat(650) });

      // Try to add more (200 chars = ~292 bytes) - would exceed 1024
      const result = cache.set('overflow', { data: 'x'.repeat(200) });

      expect(result).toBe(false);
      expect(cache.has('overflow')).toBe(false);
      expect(cache.has('big')).toBe(true);
    });

    it('should emit memory warning at 90% usage', (done) => {
      cache.on('memoryWarning', (stats: any) => {
        expect(stats.usedMemory / stats.maxMemory).toBeGreaterThanOrEqual(0.9);
        done();
      });

      // Add data to exceed 90% (690 chars = ~923 bytes = 90.1%)
      cache.set('big', { data: 'x'.repeat(690) });
    });

    it('should evict oldest entries when eviction enabled', () => {
      const evictCache = new MemoryAwareCache({
        maxMemory: 1024,
        evictOnFull: true,
      });

      // Add entries
      evictCache.set('old1', { data: 'x'.repeat(300) });
      evictCache.set('old2', { data: 'x'.repeat(300) });
      evictCache.set('old3', { data: 'x'.repeat(300) });

      // This should evict old1 (and possibly old2)
      evictCache.set('new', { data: 'x'.repeat(300) });

      expect(evictCache.has('old1')).toBe(false);
      expect(evictCache.has('new')).toBe(true);
      // Don't check old2 - it might be evicted too depending on exact sizes
    });
  });

  describe('getMemoryStats', () => {
    it('should return accurate memory statistics', () => {
      cache.set('key1', { data: 'test1' });
      cache.set('key2', { data: 'test2' });

      const stats = cache.getMemoryStats();

      expect(stats).toMatchObject({
        maxMemory: 1024,
        usedMemory: expect.any(Number),
        availableMemory: expect.any(Number),
        entryCount: 2,
        hitRate: 0, // No gets yet
      });

      expect(stats.usedMemory + stats.availableMemory).toBe(stats.maxMemory);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');

      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('missing'); // miss

      const stats = cache.getMemoryStats();
      expect(stats.hitRate).toBeCloseTo(0.667, 2); // 2/3 hits
    });
  });

  describe('memory calculation accuracy', () => {
    it('should handle various data types', () => {
      const testCases = [
        { key: 'string', value: 'test string' },
        { key: 'number', value: 12345 },
        { key: 'boolean', value: true },
        { key: 'array', value: [1, 2, 3, 'test'] },
        { key: 'object', value: { nested: { deep: 'value' } } },
        { key: 'null', value: null },
      ];

      testCases.forEach(({ key, value }) => {
        cache.flushAll();
        cache.set(key, value);
        const memory = cache.getMemoryStats().usedMemory;
        expect(memory).toBeGreaterThan(0);
        expect(memory).toBeLessThan(1024); // Should fit in our 1KB cache
      });
    });

    it('should account for key size in memory calculation', () => {
      const shortKey = 'a';
      const longKey = 'a'.repeat(100);
      const value = { data: 'test' };

      cache.set(shortKey, value);
      const shortKeyMemory = cache.getMemoryStats().usedMemory;

      cache.flushAll();

      cache.set(longKey, value);
      const longKeyMemory = cache.getMemoryStats().usedMemory;

      expect(longKeyMemory).toBeGreaterThan(shortKeyMemory);
    });
  });
});
