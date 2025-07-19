# MCP Server Rate Limiting Research

## Executive Summary

Rate limiting for MCP servers requires careful consideration of the protocol's architecture. Since MCP uses JSON-RPC 2.0 over stdio transport, there's typically one client per server process, making traditional IP-based rate limiting irrelevant. The best approach is to implement a sliding window rate limiter at the request handler level.

## Key Findings

### 1. Client Identification in MCP/JSON-RPC Context

- **Stdio Transport**: One client per process (1:1 relationship)
- **No built-in client ID**: JSON-RPC requests don't include client identifiers
- **Request structure**: `{jsonrpc: "2.0", id: string, method: string, params: object}`
- **Implication**: Rate limiting is per-server-instance, not per-client

### 2. Integration Points in Request Flow

Best integration point is in the `CallToolRequestSchema` handler, before tool execution:

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Rate limit check here
  if (!rateLimiter.isAllowed()) {
    // Return JSON-RPC error
  }
  // Normal tool execution
});
```

### 3. Error Response Format

MCP supports two error response patterns:

#### A. JSON-RPC Protocol Error (Recommended for rate limiting)
```json
{
  "jsonrpc": "2.0",
  "id": "<request-id>",
  "error": {
    "code": -32000,
    "message": "Rate limit exceeded",
    "data": {
      "limit": 100,
      "window": "60s",
      "retryAfter": 30
    }
  }
}
```

#### B. Tool-level Error
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "retryAfter": 30
    }
  }
}
```

### 4. Best Practices for Stdio Transport

1. **Sliding Window Algorithm**: More fair than fixed windows
2. **In-memory storage**: Simple array of timestamps
3. **Automatic cleanup**: Remove old timestamps on each check
4. **Configuration**: Via environment variables
5. **Graceful degradation**: Continue serving within limits

## Recommended Implementation

### Rate Limiter Class Design

```typescript
interface RateLimiterConfig {
  windowMs: number;      // Time window (default: 60000)
  maxRequests: number;   // Max requests per window (default: 100)
}

class SlidingWindowRateLimiter {
  private requests: number[] = [];
  
  constructor(private config: RateLimiterConfig) {}
  
  isAllowed(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Clean old requests
    this.requests = this.requests.filter(t => t > windowStart);
    
    // Check limit
    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  getRetryAfter(): number {
    if (this.requests.length === 0) return 0;
    const oldest = Math.min(...this.requests);
    const retryTime = oldest + this.config.windowMs;
    return Math.max(0, Math.ceil((retryTime - Date.now()) / 1000));
  }
  
  reset(): void {
    this.requests = [];
  }
}
```

### Integration Pattern

```typescript
// In index.ts
const rateLimiter = new SlidingWindowRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
  maxRequests: parseInt(process.env.RATE_LIMIT || '100')
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!rateLimiter.isAllowed()) {
    // Return JSON-RPC error directly
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32000,
        message: 'Rate limit exceeded',
        data: {
          limit: rateLimiter.config.maxRequests,
          window: `${rateLimiter.config.windowMs / 1000}s`,
          retryAfter: rateLimiter.getRetryAfter()
        }
      }
    };
  }
  
  // Normal processing...
});
```

### Environment Variables

```bash
RATE_LIMIT=100           # Max requests per window
RATE_LIMIT_WINDOW=60000  # Window size in milliseconds
```

## Testing Approach

1. **Unit tests** for rate limiter class
2. **Integration tests** with mock server
3. **Time mocking** for deterministic tests
4. **Boundary testing** at exact limits
5. **Concurrency testing** for race conditions

## Memory Considerations

- Each request stores one timestamp (8 bytes)
- 100 requests = ~800 bytes
- Automatic cleanup prevents unbounded growth
- Consider implementing max array size safeguard

## Alternative Approaches Considered

1. **Fixed window**: Simpler but can cause thundering herd
2. **Token bucket**: More complex, overkill for stdio transport
3. **Per-tool limits**: Could be added as enhancement
4. **Redis-based**: Unnecessary for single-client scenario

## Conclusion

For MCP servers using stdio transport, a simple sliding window rate limiter integrated at the request handler level provides effective protection against runaway clients while maintaining simplicity and performance.