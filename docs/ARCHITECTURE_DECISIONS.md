# Architecture Decisions

## Rate Limiting Design (Per-Process)

### Decision
Rate limiting is implemented **per-process**, not globally across all connections.

### Rationale
1. **MCP stdio transport design**: Each client connection spawns a separate server process
2. **Simplicity**: No need for distributed state management (Redis, shared memory, etc.)
3. **Appropriate for use case**: MCP servers typically serve single clients (like Claude)

### Implications
- Each connection gets its own rate limit quota
- Multiple connections can bypass the per-process limit
- This is **correct behavior** for stdio transport

### For Other Transports (Future)
If implementing SSE, WebSocket, or HTTP transports:
- Rate limiting should be handled by the **transport layer** (API gateway, reverse proxy)
- The MCP server core remains stateless and simple
- Examples:
  - nginx: `limit_req_zone` for global rate limiting
  - FastAPI: Middleware for SSE connections
  - API Gateway: Built-in rate limiting features

### Security Note
This is not a vulnerability but an architectural characteristic. Production deployments requiring global rate limits should use appropriate infrastructure:
```
Client → Load Balancer → API Gateway → MCP Server Instances
         (TCP limits)    (Rate limits)   (Per-process)
```

### Testing Approach
Tests should model real stdio behavior:
- One connection per process
- Process lifecycle tied to connection
- No parallel connections to same process
- Rate limits reset with new process

---
*Decision Date: 2025-07-29*  
*Decision Makers: Development team based on MCP protocol design analysis*