# 9. Rate Limiting in MCP Servers (Verified 2025-07-19)

## Key Findings:

1. **Client Identification**:
   - MCP servers with stdio transport have 1:1 client relationship
   - No client identifiers in JSON-RPC requests
   - Rate limiting is per-server-instance

2. **Error Response Format**:
   - Use JSON-RPC error code -32000 (server-defined error)
   - Include data with limit, window, and retryAfter
   ```typescript
   {
     error: {
       code: -32000,
       message: 'Rate limit exceeded',
       data: {
         limit: 100,
         window: 60000,
         retryAfter: 45
       }
     }
   }
   ```

3. **Integration Point**:
   - Add rate limit check in CallToolRequestSchema handler
   - Check before tool execution to avoid unnecessary processing
   - Don't rate limit tools/list requests

4. **Algorithm**:
   - Sliding window counter provides fairness
   - Tracks request timestamps in memory
   - Automatic cleanup of expired timestamps

5. **Configuration**:
   - Environment variables: RATE_LIMIT, RATE_LIMIT_WINDOW
   - Defaults: 100 requests per 60000ms (1 minute)