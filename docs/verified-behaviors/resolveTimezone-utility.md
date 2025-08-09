# Verified Behavior: resolveTimezone Utility

**Decision Date:** 2025-01-31 15:45 EST

## Purpose
Standardize timezone resolution across all tools following the project's critical convention.

## Verified Behavior

The `resolveTimezone` utility implements the following behavior:

### Core Logic
```typescript
function resolveTimezone(timezone: string | undefined, defaultTimezone: string): string {
  if (timezone === '') return 'UTC';
  return timezone ?? defaultTimezone;
}
```

### Input/Output Mapping
| Input | Output | Rationale |
|-------|--------|-----------|
| `undefined` | `defaultTimezone` (system local) | User didn't specify, use their system default |
| `""` (empty string) | `"UTC"` | Explicit request for UTC |
| `"America/New_York"` | `"America/New_York"` | Specific timezone requested |
| `null` (edge case) | `defaultTimezone` | Treated as undefined (shouldn't occur in TypeScript) |

## Implementation Requirements

1. **Must use explicit empty string check**: `timezone === ''` not `!timezone` or `timezone || default`
   - Empty string is falsy but has special meaning (UTC)
   - Using `||` operator would incorrectly treat `""` as undefined

2. **Must use nullish coalescing**: `timezone ?? defaultTimezone` not `timezone || defaultTimezone`
   - Preserves empty string handling
   - Correctly handles undefined

3. **No validation in base utility**: Timezone validation happens elsewhere
   - Keep utility focused on single responsibility
   - Validation is handled by `parseTimeInput` or specific tools

## Current Duplication

Research found this pattern duplicated across:
- 7 tools using inline resolution
- 4 tools with their own `resolveTimezone` functions (each slightly different)

## Benefits of Extraction

1. **Consistency**: Single source of truth for critical timezone convention
2. **Maintainability**: Change behavior in one place if needed
3. **Quality**: Reduce chance of implementation errors (like using `||` instead of `??`)
4. **Clarity**: Named function makes intent explicit

## Test Coverage

The utility must be tested for:
- `undefined` input → returns default timezone
- Empty string input → returns "UTC"
- Specific timezone string → returns that string unchanged
- Type safety with TypeScript

## Migration Notes

When applying to existing tools:
1. Remove inline resolution logic
2. Import `resolveTimezone` from utils
3. Replace with single function call
4. Ensure variable names remain consistent (some use `effectiveTimezone`)