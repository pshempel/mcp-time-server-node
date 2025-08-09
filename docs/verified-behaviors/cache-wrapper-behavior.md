# Verified Cache Wrapper Behavior

**Decision Date:** 2025-08-08

## Research Findings

### Current Cache Pattern (Duplicated ~10 times)
Every tool follows this identical pattern with ~12 lines of boilerplate:

```typescript
// 1. Build raw cache key
const rawCacheKey = `prefix_${param1}_${param2}_${timezone}`;

// 2. Hash the key
const cacheKey = hashCacheKey(rawCacheKey);

// 3. Check cache
const cached = cache.get<ResultType>(cacheKey);
if (cached) {
  return cached;
}

// 4. Compute result
const result = computeExpensiveOperation();

// 5. Store in cache
cache.set(cacheKey, result, CacheTTL.APPROPRIATE_TTL);

// 6. Return result
return result;
```

### Verified Behavior
1. **Type Safety**: `cache.get<T>()` preserves types correctly
2. **Cache Miss**: Returns `undefined` for missing keys
3. **TTL Values**: 
   - `CALCULATIONS`: 3600 seconds (1 hour)
   - `CURRENT_TIME`: 1 second
   - `TIMEZONE_CONVERT`: 300 seconds (5 minutes)
   - `BUSINESS_DAYS`: 86400 seconds (24 hours)
4. **Key Hashing**: Consistent SHA-256 hashing via `hashCacheKey()`
5. **Complex Objects**: Properly serializes/deserializes nested objects

### Proposed Solution

Create a generic wrapper that encapsulates the entire pattern:

```typescript
export function withCache<T>(
  cacheKey: string,
  ttl: number,
  compute: () => T
): T {
  const hashedKey = hashCacheKey(cacheKey);
  const cached = cache.get<T>(hashedKey);
  
  if (cached !== undefined) {
    return cached;
  }
  
  const result = compute();
  cache.set(hashedKey, result, ttl);
  return result;
}
```

### Usage After Refactoring

Before (12 lines):
```typescript
const rawCacheKey = `add_${time}_${amount}_${unit}_${timezone}`;
const cacheKey = hashCacheKey(rawCacheKey);
const cached = cache.get<AddTimeResult>(cacheKey);
if (cached) {
  return cached;
}
// ... compute result ...
cache.set(cacheKey, output, CacheTTL.CALCULATIONS);
return output;
```

After (3 lines):
```typescript
return withCache(
  `add_${time}_${amount}_${unit}_${timezone}`,
  CacheTTL.CALCULATIONS,
  () => {
    // ... compute result ...
    return output;
  }
);
```

### Impact
- **Lines removed**: ~120 (12 lines × 10 tools)
- **Consistency**: Single source of truth for cache logic
- **Maintainability**: Changes to cache behavior in one place
- **Type safety**: Preserved through generics

### Edge Cases Considered
1. **undefined as valid value**: Current code checks `if (cached)` which fails for falsy values. New wrapper uses `!== undefined` to handle this correctly.
2. **Async operations**: Current tools are synchronous. If async needed later, create `withCacheAsync` variant.
3. **Cache key collisions**: SHA-256 hashing makes this virtually impossible.
4. **Debug logging**: Can be added centrally in the wrapper.

### Decision Rationale
The wrapper pattern:
- Follows DRY principle by eliminating duplication
- KISS: Simple, single-purpose function
- Type-safe via TypeScript generics
- Non-breaking: Can migrate incrementally
- Testable: Single unit to test vs 10 separate implementations