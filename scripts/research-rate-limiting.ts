#!/usr/bin/env -S npx tsx
/**
 * Research script to understand MCP server rate limiting implementation
 *
 * Key questions:
 * 1. How to identify clients in MCP/JSON-RPC context
 * 2. Where to integrate rate limiting in the request flow
 * 3. How to return rate limit errors in MCP format
 * 4. Best practices for rate limiting with stdio transport
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolRequest, JSONRPCRequest } from '@modelcontextprotocol/sdk/types.js';

console.log('=== MCP Rate Limiting Research ===\n');

// 1. Explore request context
console.log('1. Request Context Analysis:');
console.log('   - MCP uses JSON-RPC 2.0 protocol');
console.log('   - Requests include: id, jsonrpc, method, params');
console.log("   - With stdio transport, there's typically one client per process");
console.log('   - No built-in client identification in the protocol\n');

// 2. Rate limiting strategies for MCP
console.log('2. Rate Limiting Strategies:');
console.log('   a) Per-process rate limiting (single client per stdio connection)');
console.log('   b) Per-tool rate limiting (limit specific tool usage)');
console.log('   c) Global rate limiting (across all operations)');
console.log('   d) Sliding window vs fixed window approaches\n');

// 3. Integration points
console.log('3. Integration Points in MCP Server:');
console.log('   - Request handler wrapper (before tool execution)');
console.log('   - Middleware pattern in request processing');
console.log('   - Custom error handling for rate limit exceeded\n');

// 4. Error response format
console.log('4. MCP Error Response Format:');
const exampleError = {
  jsonrpc: '2.0',
  id: 'request-id',
  error: {
    code: -32000, // Server error range: -32000 to -32099
    message: 'Rate limit exceeded',
    data: {
      limit: 100,
      window: '1m',
      retryAfter: 30, // seconds
    },
  },
};
console.log(JSON.stringify(exampleError, null, 2));
console.log('\n');

// 5. Implementation approach
console.log('5. Recommended Implementation Approach:');
console.log('   - Use a sliding window counter for fairness');
console.log('   - Store request timestamps in memory (Map or array)');
console.log('   - Clean up old entries periodically');
console.log('   - Return standardized JSON-RPC errors');
console.log('   - Include retry-after header in error data\n');

// 6. Example rate limiter design
console.log('6. Example Rate Limiter Design:');
console.log(`
interface RateLimiterConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class SlidingWindowRateLimiter {
  private requests: number[] = []; // timestamps
  
  constructor(private config: RateLimiterConfig) {}
  
  isAllowed(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Remove old requests outside window
    this.requests = this.requests.filter(time => time > windowStart);
    
    // Check if under limit
    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  getRetryAfter(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    const retryTime = oldestRequest + this.config.windowMs;
    return Math.max(0, Math.ceil((retryTime - Date.now()) / 1000));
  }
}
`);

// 7. Integration with MCP server
console.log('\n7. Integration Pattern:');
console.log(`
// Wrap the request handler
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  // Check rate limit
  if (!rateLimiter.isAllowed()) {
    return {
      error: {
        code: -32000,
        message: 'Rate limit exceeded',
        data: {
          limit: config.maxRequests,
          window: config.windowMs / 1000 + 's',
          retryAfter: rateLimiter.getRetryAfter(),
        }
      }
    };
  }
  
  // Process request normally
  // ...
});
`);

// 8. Testing considerations
console.log('\n8. Testing Considerations:');
console.log('   - Mock Date.now() for deterministic tests');
console.log('   - Test boundary conditions (exactly at limit)');
console.log('   - Test cleanup of old requests');
console.log('   - Test concurrent requests');
console.log('   - Verify error response format\n');

// 9. Production considerations
console.log('9. Production Considerations:');
console.log('   - Memory usage with high request volume');
console.log('   - Graceful degradation under load');
console.log('   - Monitoring and alerting');
console.log('   - Configuration via environment variables');
console.log('   - Different limits for different tools\n');

console.log('=== Research Complete ===');
