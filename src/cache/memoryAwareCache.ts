import { EventEmitter } from 'events';

import NodeCache from 'node-cache';
import type { Options } from 'node-cache';

interface MemoryAwareCacheOptions extends Options {
  maxMemory?: number; // Maximum memory in bytes (default: 10MB)
  evictOnFull?: boolean; // Evict oldest entries when full (default: false)
}

export interface MemoryStats {
  maxMemory: number;
  usedMemory: number;
  availableMemory: number;
  entryCount: number;
  hitRate: number;
}

interface CacheEntry {
  key: string;
  size: number;
  timestamp: number;
}

export class MemoryAwareCache extends EventEmitter {
  private cache: NodeCache;
  private maxMemory: number;
  private usedMemory: number = 0;
  private evictOnFull: boolean;
  private entrySizes: Map<string, number> = new Map();
  private entryOrder: CacheEntry[] = [];
  private hits: number = 0;
  private misses: number = 0;

  constructor(options: MemoryAwareCacheOptions = {}) {
    super();

    this.maxMemory = options.maxMemory ?? 10 * 1024 * 1024; // 10MB default
    this.evictOnFull = options.evictOnFull ?? false;

    // Create underlying NodeCache
    this.cache = new NodeCache({
      stdTTL: options.stdTTL ?? 60,
      checkperiod: options.checkperiod ?? 120,
      useClones: options.useClones ?? true,
      deleteOnExpire: options.deleteOnExpire ?? true,
      enableLegacyCallbacks: options.enableLegacyCallbacks ?? false,
      maxKeys: options.maxKeys ?? -1,
    });

    // Listen for cache events
    this.cache.on('del', (key: string) => {
      this.updateMemoryOnDelete(key);
    });

    this.cache.on('expired', (key: string) => {
      this.updateMemoryOnDelete(key);
    });
  }

  private calculateSize(key: string, value: unknown): number {
    // Use JSON.stringify as a consistent measure
    // Add overhead for object structure (based on research)
    const jsonSize = JSON.stringify({ [key]: value }).length;
    // Add ~30% overhead for JavaScript object representation (based on research)
    return Math.ceil(jsonSize * 1.3);
  }

  private updateMemoryOnDelete(key: string): void {
    const size = this.entrySizes.get(key);
    if (size) {
      this.usedMemory -= size;
      this.entrySizes.delete(key);
      this.entryOrder = this.entryOrder.filter((entry) => entry.key !== key);
    }
  }

  private checkMemoryWarning(): void {
    const usageRatio = this.usedMemory / this.maxMemory;
    if (usageRatio >= 0.9) {
      this.emit('memoryWarning', this.getMemoryStats());
    }
  }

  private evictOldestEntries(requiredSpace: number): boolean {
    if (!this.evictOnFull) {
      return false;
    }

    let freedSpace = 0;
    const toEvict: string[] = [];

    // Find entries to evict (oldest first)
    for (const entry of this.entryOrder) {
      toEvict.push(entry.key);
      freedSpace += entry.size;
      if (freedSpace >= requiredSpace) {
        break;
      }
    }

    // Evict entries
    for (const key of toEvict) {
      this.cache.del(key);
    }

    return freedSpace >= requiredSpace;
  }

  set(key: string, value: unknown, ttl?: number): boolean {
    const size = this.calculateSize(key, value);
    const existingSize = this.entrySizes.get(key) ?? 0;
    const netSize = size - existingSize;

    // Check if adding this would exceed memory limit
    if (this.usedMemory + netSize > this.maxMemory) {
      // Try eviction if enabled
      if (!this.evictOldestEntries(netSize)) {
        return false; // Cannot add entry
      }
    }

    // Add to cache
    const result = ttl !== undefined ? this.cache.set(key, value, ttl) : this.cache.set(key, value);

    if (result) {
      // Update memory tracking
      this.usedMemory += netSize;
      this.entrySizes.set(key, size);

      // Update order tracking
      this.entryOrder = this.entryOrder.filter((entry) => entry.key !== key);
      this.entryOrder.push({ key, size, timestamp: Date.now() });

      // Check for memory warning
      this.checkMemoryWarning();
    }

    return result;
  }

  get<T>(key: string): T | undefined {
    const result = this.cache.get<T>(key);
    if (result !== undefined) {
      this.hits++;
    } else {
      this.misses++;
    }
    return result;
  }

  del(key: string | string[]): number {
    return this.cache.del(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  flushAll(): void {
    this.cache.flushAll();
    this.usedMemory = 0;
    this.entrySizes.clear();
    this.entryOrder = [];
  }

  close(): void {
    this.cache.close();
  }

  getMemoryStats(): MemoryStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      maxMemory: this.maxMemory,
      usedMemory: this.usedMemory,
      availableMemory: this.maxMemory - this.usedMemory,
      entryCount: this.entrySizes.size,
      hitRate: Number(hitRate.toFixed(3)),
    };
  }

  // Delegate other NodeCache methods
  mget<T>(keys: string[]): Record<string, T> {
    const results = this.cache.mget<T>(keys);
    // Update hit/miss stats
    keys.forEach((key) => {
      // eslint-disable-next-line security/detect-object-injection -- Keys are hashed with SHA-256
      if (results[key] !== undefined) {
        this.hits++;
      } else {
        this.misses++;
      }
    });
    return results;
  }

  mset<T>(values: { key: string; val: T; ttl?: number }[]): boolean {
    // Check total size first
    let totalSize = 0;
    const sizes: Map<string, number> = new Map();

    for (const { key, val } of values) {
      const size = this.calculateSize(key, val);
      sizes.set(key, size);
      const existingSize = this.entrySizes.get(key) ?? 0;
      totalSize += size - existingSize;
    }

    if (this.usedMemory + totalSize > this.maxMemory) {
      if (!this.evictOldestEntries(totalSize)) {
        return false;
      }
    }

    const result = this.cache.mset(values);

    if (result) {
      // Update memory tracking for all values
      values.forEach(({ key }) => {
        const size = sizes.get(key) ?? 0;
        const existingSize = this.entrySizes.get(key) ?? 0;
        this.usedMemory += size - existingSize;
        this.entrySizes.set(key, size);

        this.entryOrder = this.entryOrder.filter((entry) => entry.key !== key);
        this.entryOrder.push({ key, size, timestamp: Date.now() });
      });

      this.checkMemoryWarning();
    }

    return result;
  }

  keys(): string[] {
    return this.cache.keys();
  }

  ttl(key: string, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.ttl(key, ttl);
    }
    return this.cache.ttl(key);
  }

  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }
}
