# MCP SDK Server Behaviors (Verified 2025-07-19)

## Server Creation
```typescript
const server = new Server({
  name: 'server-name',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});
```

## Request Handler Registration
1. **ListToolsRequestSchema**: method is `tools/list`
2. **CallToolRequestSchema**: method is `tools/call`
3. Handlers are async functions
4. SDK validates requests automatically

## Tool Response Format
```typescript
// Success response
{
  content: [
    { type: 'text', text: 'result string' }
  ]
}

// Error response (throw error or return)
{
  error: {
    code: 'ERROR_CODE',
    message: 'Error message',
    details: { /* optional */ }
  }
}
```

## Tool Input Schema
- Uses JSON Schema format
- Properties: type, properties, required, description
- SDK validates tool arguments automatically

## Transport
- StdioServerTransport for CLI usage
- Connect with `server.connect(transport)`
- Starts JSON-RPC message loop

## Testing Approach
- Can test handlers directly without transport
- Create mock request objects
- Test tool registration separately from execution