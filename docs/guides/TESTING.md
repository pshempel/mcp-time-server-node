# MCP Server Testing Guide

This guide explains how to write different types of tests for MCP (Model Context Protocol) servers, with a focus on integration testing.

## Table of Contents
- [Overview](#overview)
- [Test Types](#test-types)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Full Protocol Tests](#full-protocol-tests)
- [Best Practices](#best-practices)

## Overview

MCP servers require multiple levels of testing to ensure reliability:
1. **Unit Tests** - Test individual functions/tools in isolation
2. **Handler Tests** - Test request handlers with mocked dependencies
3. **Integration Tests** - Test full JSON-RPC protocol flow with real implementations

## Test Types

### Unit Tests
Test individual tool functions with real implementations:

```typescript
// tests/tools/getCurrentTime.test.ts
import { getCurrentTime } from '../../src/tools/getCurrentTime';

describe('getCurrentTime', () => {
  it('should return current time in UTC', () => {
    const result = getCurrentTime({});
    expect(result.timezone).toBe('UTC');
    expect(result.unix).toBeCloseTo(Date.now() / 1000, 0);
  });
});
```

### Handler Tests
Test server request handlers with mocked tools:

```typescript
// tests/index.test.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

jest.mock('../src/tools', () => ({
  getCurrentTime: jest.fn(),
  // ... other mocked tools
}));

describe('MCP Server Handlers', () => {
  let server: Server;
  
  beforeEach(() => {
    server = new Server({
      name: 'test-server',
      version: '1.0.0'
    });
    // Set up handlers...
  });
  
  it('should handle tools/list request', async () => {
    const handler = server['_requestHandlers'].get('tools/list');
    const result = await handler({ method: 'tools/list' }, {});
    expect(result.tools).toHaveLength(8);
  });
});
```

## Integration Tests

### Setting Up InMemoryTransport

The MCP SDK provides `InMemoryTransport` for testing without stdio:

```typescript
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('MCP Server Integration', () => {
  let server: Server;
  let client: Client;
  let serverTransport: InMemoryTransport;
  let clientTransport: InMemoryTransport;

  beforeEach(async () => {
    // Create linked transport pair
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    
    // Set up server with real implementations
    server = new Server({
      name: 'mcp-time-server',
      version: '1.0.0'
    }, {
      capabilities: { tools: {} }
    });
    
    // Register handlers (use real tool implementations)
    // ... handler setup ...
    
    // Create and connect client
    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    });
    
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });
});
```

### Testing Tool Execution

```typescript
it('should execute get_current_time through full protocol', async () => {
  const response = await client.request({
    method: 'tools/call',
    params: {
      name: 'get_current_time',
      arguments: {
        timezone: 'America/New_York',
        format: 'yyyy-MM-dd HH:mm:ss'
      }
    }
  });

  expect(response.content).toHaveLength(1);
  expect(response.content[0].type).toBe('text');
  
  const result = JSON.parse(response.content[0].text);
  expect(result.timezone).toBe('America/New_York');
  expect(result.offset).toMatch(/^[+-]\d{2}:\d{2}$/);
});
```

### Testing Error Handling

```typescript
it('should handle errors through protocol', async () => {
  await expect(
    client.request({
      method: 'tools/call',
      params: {
        name: 'convert_timezone',
        arguments: {
          time: '2025-01-01T00:00:00Z',
          from_timezone: 'Invalid/Zone',
          to_timezone: 'UTC'
        }
      }
    })
  ).rejects.toMatchObject({
    code: 'INVALID_TIMEZONE',
    message: expect.stringContaining('Invalid timezone')
  });
});
```

## Full Protocol Tests

### Message Interception

Test JSON-RPC message structure:

```typescript
it('should send proper JSON-RPC messages', async () => {
  const sentMessages: any[] = [];
  const receivedMessages: any[] = [];
  
  // Intercept client messages
  const originalClientSend = clientTransport.send.bind(clientTransport);
  clientTransport.send = async (message, options) => {
    sentMessages.push(message);
    return originalClientSend(message, options);
  };
  
  // Make request
  await client.request({
    method: 'tools/list',
    params: {}
  });
  
  // Verify message structure
  expect(sentMessages[0]).toMatchObject({
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: expect.any(String)
  });
});
```

### Testing Rate Limiting

```typescript
it('should enforce rate limits through protocol', async () => {
  // Make requests up to limit
  const limit = 100; // Or read from env
  const promises = [];
  
  for (let i = 0; i < limit; i++) {
    promises.push(
      client.request({
        method: 'tools/call',
        params: { name: 'get_current_time', arguments: {} }
      })
    );
  }
  
  await Promise.all(promises);
  
  // Next request should fail
  await expect(
    client.request({
      method: 'tools/call',
      params: { name: 'get_current_time', arguments: {} }
    })
  ).rejects.toMatchObject({
    code: -32000,
    message: 'Rate limit exceeded'
  });
});
```

## Best Practices

### 1. Test Organization
```
tests/
├── unit/              # Individual function tests
│   └── tools/         # Tool-specific tests
├── integration/       # Full protocol tests
│   ├── tools.test.ts  # Tool execution tests
│   ├── errors.test.ts # Error handling tests
│   └── limits.test.ts # Rate limiting tests
└── mocks/            # Shared mocks and helpers
```

### 2. Test Data Management
```typescript
// tests/fixtures/timeTestData.ts
export const TEST_TIMEZONES = {
  valid: ['UTC', 'America/New_York', 'Asia/Tokyo'],
  invalid: ['Invalid/Zone', 'Bad/Timezone'],
  edge: ['Etc/GMT+12', 'Etc/GMT-14']
};

export const TEST_DATES = {
  fixed: '2025-01-01T00:00:00Z',
  leapYear: '2024-02-29T00:00:00Z',
  dstChange: '2025-03-09T02:00:00-05:00'
};
```

### 3. Helper Functions
```typescript
// tests/helpers/mcpHelpers.ts
export async function createTestClient() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  // ... setup code ...
  return { client, server, cleanup };
}

export async function callTool(client: Client, name: string, args: any) {
  const response = await client.request({
    method: 'tools/call',
    params: { name, arguments: args }
  });
  return JSON.parse(response.content[0].text);
}
```

### 4. Environment Setup
```typescript
// tests/setup.ts
beforeAll(() => {
  // Set test environment variables
  process.env.RATE_LIMIT = '1000';
  process.env.RATE_LIMIT_WINDOW = '60000';
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Clean up
  delete process.env.RATE_LIMIT;
  delete process.env.RATE_LIMIT_WINDOW;
});
```

### 5. Common Pitfalls to Avoid

1. **Don't use StdioServerTransport in tests**
   - Use InMemoryTransport instead
   - Stdio requires actual process communication

2. **Always clean up connections**
   ```typescript
   afterEach(async () => {
     await client?.close();
     await server?.close();
   });
   ```

3. **Mock time-sensitive operations**
   ```typescript
   beforeEach(() => {
     jest.useFakeTimers();
     jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
   });
   ```

4. **Test both success and error paths**
   - Valid inputs
   - Invalid inputs
   - Edge cases
   - Protocol errors

5. **Verify actual behavior, not implementation**
   - Test what the tool returns, not how it calculates
   - Focus on contract compliance

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- tests/unit

# Run integration tests only
npm test -- tests/integration

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Debugging Tests

### Enable Debug Logging
```typescript
// Set DEBUG environment variable
process.env.DEBUG = 'mcp:*';
```

### Inspect Transport Messages
```typescript
clientTransport.onmessage = (message) => {
  console.log('Client received:', JSON.stringify(message, null, 2));
};
```

### Use Jest Debug Mode
```bash
# Run in Node debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Summary

Effective MCP server testing requires:
1. Unit tests for individual tools
2. Handler tests with mocked dependencies
3. Full integration tests with InMemoryTransport
4. Proper test organization and helpers
5. Attention to protocol compliance

By following this guide, you can ensure your MCP server is thoroughly tested at all levels, from individual functions to complete protocol interactions.