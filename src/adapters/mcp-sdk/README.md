# MCP SDK Adapter

This is our internal SDK that wraps the broken MCP SDK and provides proper error handling.

## Why This Exists

The MCP SDK has fundamental flaws:
- ErrorCode export bug requires `require()` workaround
- Only 3 error codes for everything (InvalidParams, InvalidRequest, InternalError)
- No meaningful error differentiation possible
- Every MCP implementation creates their own workaround

## How to Use

### In Tools

```typescript
// NEVER import from @modelcontextprotocol/sdk directly!
import {
  ValidationError,
  TimezoneError,
  DateParsingError,
  // ... other error types
} from '../adapters/mcp-sdk';

export function myTool(params: unknown): ToolResult {
  // Validate input
  if (!params.timezone) {
    throw new ValidationError('Missing required field: timezone');
  }
  
  // Check specific conditions
  if (!isValidTimezone(params.timezone)) {
    throw new TimezoneError('Invalid timezone', params.timezone);
  }
  
  // ... tool logic
}
```

### Error Types

- `ValidationError` - Invalid input parameters (400) → InvalidParams
- `TimezoneError` - Invalid timezone specification (400) → InvalidParams  
- `DateParsingError` - Cannot parse date/time (400) → InvalidParams
- `BusinessHoursError` - Invalid business hours config (400) → InvalidRequest
- `HolidayDataError` - Cannot fetch holiday data (503) → InvalidRequest
- `TimeCalculationError` - Arithmetic overflow/underflow (500) → InternalError

### In index.ts

The main server file catches our errors and maps them:

```typescript
import { mapToMcpError } from './adapters/mcp-sdk';

try {
  const result = await toolFunction(args);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
} catch (error) {
  throw mapToMcpError(error, toolName);
}
```

## Testing

When testing tools, mock the adapter:

```typescript
jest.mock('../adapters/mcp-sdk', () => ({
  ValidationError: jest.fn(),
  TimezoneError: jest.fn(),
  // ... other errors
}));
```

This keeps tests focused on tool logic, not SDK behavior.

## Architecture

```
/adapters/mcp-sdk/
  index.ts      - Public API (what tools import)
  errors.ts     - Our error class hierarchy
  mapper.ts     - Maps our errors to MCP SDK
  types.d.ts    - Fixes SDK type definitions
  README.md     - This file
```

## Future-Proofing

When the MCP SDK changes (and it will), we only update this adapter.
Our tools remain unchanged because they import from here, not the SDK.