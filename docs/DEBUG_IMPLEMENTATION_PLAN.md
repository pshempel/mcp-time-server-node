# Debug Implementation Plan - Post Business Logic Refactoring

**Date:** 2025-08-08
**Context:** After Phase 1-2 refactoring, need to add debug to new utilities

## Current State Analysis

### Utilities WITH Debug Coverage ✅
- `holidayAggregator.ts` - 5 debug.business statements
- `parseTimeInput.ts` - 4 debug.parse statements  
- `withCache.ts` - debug.cache for hits/misses

### Utilities MISSING Debug Coverage ❌
- `cacheKeyBuilder.ts` - 0 debug statements
- `businessHoursHelpers.ts` - 0 debug statements

### Available Debug Namespaces
From `debugEnhanced.ts`:
- `debug.business` - Business logic decisions
- `debug.decision` - Critical decisions with context
- `debug.cache` - Cache operations
- `debug.utils` - Utility functions
- `debug.timing` - Performance tracking
- `debug.parse` - Parsing operations
- `debug.validation` - Validation operations
- `debug.holidays` - Holiday calculations
- `debug.error` - Error handling
- `debug.trace` - Detailed tracing

## Implementation Strategy

### Principle: Strategic, Not Exhaustive
Based on Phase 5 learning: Add debug where it provides VALUE, not everywhere.

### 1. cacheKeyBuilder.ts
**Namespace:** `debug.cache` or `debug.utils`
**What to log:**
- When special characters are escaped
- When arrays/objects create complex keys
- Final cache key composition (for debugging collisions)

**Why:** Cache key collisions are hard to debug without visibility into key generation.

### 2. businessHoursHelpers.ts  
**Namespace:** `debug.business`
**What to log:**
- Schedule type detection (weekly vs daily)
- Overlap calculations
- Partial day hour calculations
- Edge cases (overnight spans, timezone boundaries)

**Why:** Complex business logic with many edge cases that affect billing/calculations.

### 3. Verification Strategy
After adding debug:
1. Run with `DEBUG=mcp:* npm test` to verify output
2. Check for noise vs signal ratio
3. Ensure debug doesn't affect performance

## Code Patterns to Follow

### Pattern 1: Entry/Exit for Complex Functions
```typescript
export function complexUtility(params: Params): Result {
  debug.utils('complexUtility called with:', { 
    paramCount: params.items.length,
    // Don't log sensitive data
  });
  
  // ... logic ...
  
  debug.utils('complexUtility completed:', { resultCount: result.length });
  return result;
}
```

### Pattern 2: Decision Points
```typescript
if (hasSpecialCharacters) {
  debug.decision('Escaping special characters in cache key', {
    before: value,
    after: escaped
  });
}
```

### Pattern 3: Error Context
```typescript
} catch (error) {
  debug.error('Failed to build cache key:', {
    prefix,
    options,
    error: error.message
  });
  throw error;
}
```

## What NOT to Debug

Based on KISS principle:
- Simple getters/setters
- Pure formatting functions with no logic
- Internal helper functions called by already-debugged parents
- Anything that would create noise without value

## Success Metrics

1. **Coverage:** Key decision points have debug statements
2. **Signal/Noise:** Debug output is helpful, not overwhelming  
3. **Performance:** No measurable impact on performance
4. **Debugging:** Can trace issues without adding temporary console.logs

## Next Steps

1. ✅ Research complete - know what needs debug
2. ⏳ Add debug to cacheKeyBuilder (5-10 strategic points)
3. ⏳ Add debug to businessHoursHelpers (8-12 strategic points)
4. ⏳ Test with DEBUG=mcp:* to verify quality
5. ⏳ Document debug usage in CLAUDE.md for future sessions