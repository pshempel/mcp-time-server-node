# Developer Guide - Adding New Tools to MCP Time Server

This guide provides step-by-step instructions for adding new tools, with all the details that keep getting looked up repeatedly.

## Table of Contents
1. [Adding a New Tool - Complete Checklist](#adding-a-new-tool---complete-checklist)
2. [Cache TTL Constants](#cache-ttl-constants)
3. [Integration Test Architecture](#integration-test-architecture)
4. [Common Import Patterns](#common-import-patterns)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Testing Patterns](#testing-patterns)

## Adding a New Tool - Complete Checklist

When adding a new tool like `calculate_deadline`, follow these steps IN ORDER:

### 1. Research Phase
```bash
# Create research script
touch research/calculate-deadline-research.js
# Test date-fns behavior, edge cases, timezone handling
```

### 2. Documentation Phase
```bash
# Document verified behavior
touch docs/verified-behaviors/calculate-deadline-behavior.md
```

### 3. Test Phase (TDD - Red)
```bash
# Create unit test file
touch tests/tools/calculateDeadline.test.ts

# Create integration test file  
touch tests/integration/tools/calculateDeadline.integration.test.ts

# Run tests to see them fail (RED phase)
make test
```

### 4. Implementation Phase (TDD - Green)
```bash
# Create tool implementation
touch src/tools/calculateDeadline.ts

# Add to exports in src/tools/index.ts

# Run tests until they pass
make test-watch  # Or make test-quick if having issues
```

### 5. Server Integration - THREE PLACES TO UPDATE

#### A. Update src/index.ts
```typescript
// 1. Import the tool
import {
  // ... existing imports
  calculateDeadline,  // ADD THIS
} from './tools/index.js';

// 2. Add tool definition to TOOL_DEFINITIONS array
{
  name: 'calculate_deadline',
  description: 'Calculate project deadline considering business days',
  inputSchema: {
    type: 'object' as const,
    properties: {
      start_date: { type: 'string' as const, description: 'Start date' },
      days: { type: 'number' as const, description: 'Number of business days' },
      timezone: { type: 'string' as const, description: 'Timezone (default: system)' },
      holidays: { 
        type: 'array' as const, 
        items: { type: 'string' as const },
        description: 'Holiday dates to exclude' 
      },
    },
    required: ['start_date', 'days'],
  },
},

// 3. Add to TOOL_FUNCTIONS mapping
const TOOL_FUNCTIONS: Record<string, (params: unknown) => unknown> = {
  // ... existing mappings
  calculate_deadline: (params: unknown) =>
    calculateDeadline(params as Parameters<typeof calculateDeadline>[0]),
};
```

#### B. Update tests/integration/helpers/setup.ts (CRITICAL!)
```typescript
// 1. Import the tool
import {
  // ... existing imports
  calculateDeadline,  // ADD THIS
} from '../../../src/tools/index';

// 2. Add EXACT SAME tool definition to TOOL_DEFINITIONS array
// MUST match src/index.ts exactly!

// 3. Add to TOOL_FUNCTIONS mapping
const TOOL_FUNCTIONS: Record<string, (params: any) => any> = {
  // ... existing mappings
  calculate_deadline: calculateDeadline as (params: any) => any,
};
```

#### C. Update test expectations
```typescript
// tests/integration/protocol.test.ts
// Update tool count from 10 to 11
expect(result.tools).toHaveLength(11);
```

### 6. Final Steps
```bash
# Verify everything works
make verify

# Update documentation
- Update README.md tool count and list
- Update scripts/test-mcp-comprehensive.js with test cases

# Commit your work
git add -A
git commit -m "feat: implement calculate_deadline tool"
```

### 7. If Things Go Wrong
```bash
# Jest module resolution issues
make fix-jest

# Still broken? Nuclear option:
make reset
```

## Cache TTL Constants

Located in `src/cache/timeCache.ts`:

```typescript
export const CacheTTL = {
  CURRENT_TIME: 1,        // 1 second - for "now" operations
  TIMEZONE_CONVERT: 300,  // 5 minutes - for timezone conversions
  CALCULATIONS: 3600,     // 1 hour - for most calculations
  BUSINESS_DAYS: 86400,   // 24 hours - for business days/holidays
};
```

### When to use each:
- `CURRENT_TIME`: Operations that change every second (current time, "today")
- `TIMEZONE_CONVERT`: Timezone conversion results
- `CALCULATIONS`: Most date calculations that don't change frequently
- `BUSINESS_DAYS`: Holiday lookups and business day calculations

### Cache Implementation Pattern:
```typescript
import { CacheTTL, cache } from '../cache/timeCache';

export function myTool(params: MyToolParams): any {
  const cacheKey = `mytool:${JSON.stringify(params)}`;
  const cached = cache.get<any>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // ... do calculation
  const result = calculateSomething();
  
  // Cache with appropriate TTL
  cache.set(cacheKey, result, CacheTTL.CALCULATIONS);
  return result;
}
```

## Integration Test Architecture

### Why Duplicate Tool Definitions?

The integration tests maintain **separate tool definitions** in `tests/integration/helpers/setup.ts` to:
1. Test the full MCP protocol flow
2. Isolate test environment from production code
3. Allow testing of protocol-level behaviors

### Key Files:
- `src/index.ts` - Production tool definitions
- `tests/integration/helpers/setup.ts` - Test tool definitions (MUST BE KEPT IN SYNC!)

### Integration Test Structure:
```typescript
// tests/integration/tools/myTool.integration.test.ts
import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';

describe('my_tool integration', () => {
  it('should do something', async () => {
    const { client, cleanup } = await createTestEnvironment();
    
    try {
      const result = await callTool(client, 'my_tool', {
        param1: 'value1',
      });
      
      expect(result).toBe('expected');
    } finally {
      await cleanup();
    }
  });
});
```

## Common Import Patterns

### Tool Implementation Imports:
```typescript
// src/tools/myTool.ts
import { parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { MyToolParams, TimeServerError, TimeServerErrorCodes } from '../types';
import { validateTimezone, validateDateString } from '../utils/validation';
import { getSystemTimezone, parseTimeInput } from '../utils/dateUtils';
import { CacheTTL, cache } from '../cache/timeCache';
```

### Unit Test Imports:
```typescript
// tests/tools/myTool.test.ts
import { myTool } from '../../src/tools/myTool';
import { addDays, subDays } from 'date-fns';
import { TimeServerErrorCodes } from '../../src/types';
```

### Integration Test Imports:
```typescript
// tests/integration/tools/myTool.integration.test.ts
import { createTestEnvironment } from '../helpers/setup';
import { callTool } from '../helpers/tools';
import { addDays } from 'date-fns';
```

## Error Handling Patterns

### Consistent Error Format:
```typescript
// Always throw this structure:
throw {
  error: {
    code: TimeServerErrorCodes.INVALID_PARAMETER,
    message: 'Descriptive error message',
    details: { param: value }, // optional
  },
};
```

### Common Error Codes:
```typescript
export enum TimeServerErrorCodes {
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT', 
  INVALID_TIMEZONE = 'INVALID_TIMEZONE',
  INVALID_TIME_UNIT = 'INVALID_TIME_UNIT',
  INVALID_PATTERN = 'INVALID_PATTERN',
  BUSINESS_HOURS_ERROR = 'BUSINESS_HOURS_ERROR',
}
```

### Error Testing Pattern:
```typescript
// Unit tests
try {
  myTool({ bad: 'params' } as any);
} catch (e: any) {
  expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_PARAMETER);
  expect(e.error.message).toContain('required');
}

// Integration tests  
await expect(
  callTool(client, 'my_tool', { bad: 'params' })
).rejects.toMatchObject({
  code: 'INVALID_PARAMETER',
  message: expect.stringContaining('required'),
});
```

## Testing Patterns

### Date Testing Helpers:
```typescript
// Use date-fns for relative dates
const tomorrow = addDays(new Date(), 1);
const nextWeek = addDays(new Date(), 7);

// Format for date-only parameters
const dateString = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

// Create dates in specific timezone (for holidays)
const christmas2025 = new Date(2025, 11, 25); // Month is 0-indexed!
```

### Timezone Testing:
```typescript
// Test with multiple timezones
const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];

// Empty string = UTC
expect(myTool({ timezone: '' })).toBe('UTC result');

// Undefined = system timezone  
expect(myTool({ timezone: undefined })).toBe('System tz result');
```

### Async Test Pattern:
```typescript
it('should handle async operations', async () => {
  const { client, cleanup } = await createTestEnvironment();
  
  try {
    const result = await callTool(client, 'tool_name', params);
    expect(result).toBeDefined();
  } finally {
    await cleanup(); // ALWAYS cleanup!
  }
});
```

## Quick Reference Commands

```bash
# Run specific test file
npm test tests/tools/calculateDeadline.test.ts

# Run all tests
make test

# Run tests with MCP reload reminder
make test-verify

# Build TypeScript
npm run build

# Lint and fix
npm run lint:fix

# Full verification
make verify
```

## Common Pitfalls

1. **Forgetting to update integration test setup** - Tool works in unit tests but fails in integration
2. **Wrong cache TTL** - Using CURRENT_TIME for calculations that should be cached longer
3. **ISO date parsing** - Remember: `new Date('2025-01-01')` is UTC, not local!
4. **Not handling empty string timezone** - Empty string means UTC, not system timezone
5. **Missing tool count update** - Protocol tests fail expecting wrong number of tools

## Quick Lookup - Where Things Live

### Cache:
- **Cache instance & TTL constants**: `src/cache/timeCache.ts`
- **Import**: `import { CacheTTL, cache } from '../cache/timeCache';`

### Error Handling:
- **Error codes & types**: `src/types/index.ts`
- **Import**: `import { TimeServerErrorCodes } from '../types';`

### Integration Test Setup:
- **DUPLICATE tool definitions**: `tests/integration/helpers/setup.ts`
- **Test helpers**: `tests/integration/helpers/tools.ts`
- **Import**: `import { createTestEnvironment } from '../helpers/setup';`

### Validation & Utils:
- **Timezone validation**: `src/utils/validation.ts`
- **Date parsing helpers**: `src/utils/dateUtils.ts`
- **System timezone**: `getSystemTimezone()` from `src/utils/dateUtils.ts`

### Adding a Tool Requires Updates To:
1. `src/tools/yourTool.ts` - Implementation
2. `src/tools/index.ts` - Export
3. `src/index.ts` - Tool definition & mapping
4. `tests/integration/helpers/setup.ts` - Duplicate definition & mapping
5. `tests/integration/protocol.test.ts` - Update tool count
6. `README.md` - Update tool count & list
7. `scripts/test-mcp-comprehensive.js` - Add test cases

---

Remember: When in doubt, check how existing tools do it. The patterns are consistent throughout the codebase.