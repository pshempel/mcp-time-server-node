# MCP Debug Tools

A collection of debugging utilities for MCP (Model Context Protocol) servers. These tools help diagnose issues with server configuration, rate limiting, and protocol communication.

## Tools Overview

| Tool | Purpose | Use Case |
|------|---------|----------|
| `mcp_env_debugger.py` | Test environment variable handling | Debug server configuration issues |
| `rate_limit_debugger.py` | Test rate limiting functionality | Debug rate limiting and detect bypasses |
| `mcp_protocol_debugger.py` | Test MCP protocol communication | Debug protocol handshake and tool execution |

## Quick Start

```bash
# Test basic environment variable handling
python3 tools/debug/mcp_env_debugger.py

# Test rate limiting with specific settings
python3 tools/debug/rate_limit_debugger.py --scenario burst --limit 3

# Test full MCP protocol flow
python3 tools/debug/mcp_protocol_debugger.py --verbose

# Interactive protocol debugging
python3 tools/debug/mcp_protocol_debugger.py --interactive
```

## MCP Environment Debugger

Tests if your MCP server correctly reads environment variables and responds to basic requests.

### Usage

```bash
# Basic test with defaults (3 requests, 5s window)
python3 tools/debug/mcp_env_debugger.py

# Custom rate limit settings
python3 tools/debug/mcp_env_debugger.py --rate-limit 5 --window 10000 --requests 7

# Verbose output with troubleshooting tips
python3 tools/debug/mcp_env_debugger.py --verbose
```

### Example Output

```
🔧 MCP Environment Variable Debug Test
==================================================
Rate limit: 3 requests
Window: 5000ms (5.0s)
Test requests: 4
Expected: 3 success, 1 rate limited

Sending 4 requests rapidly...
Request 1: SUCCESS
Request 2: SUCCESS  
Request 3: SUCCESS
Request 4: RATE LIMITED

==================================================
📊 Test Results
==================================================
Requests sent: 4
Successful: 3
Rate limited: 1
Errors: 0

📈 Analysis:
Expected successful: 3
Expected rate limited: 1
✅ Rate limiting working correctly!
```

### Options

- `--rate-limit N` - Set RATE_LIMIT environment variable
- `--window MS` - Set RATE_LIMIT_WINDOW environment variable  
- `--requests N` - Number of requests to send
- `--verbose` - Show detailed protocol communication
- `--server PATH` - Custom path to server script

## Rate Limit Debugger

Specialized tool for testing rate limiting functionality and detecting bypass methods.

### Usage

```bash
# Test burst scenario (default)
python3 tools/debug/rate_limit_debugger.py --scenario burst

# Test parallel connection bypass
python3 tools/debug/rate_limit_debugger.py --scenario bypass --connections 3

# Test sliding window timing
python3 tools/debug/rate_limit_debugger.py --scenario timing --limit 5 --window 2000
```

### Scenarios

#### Burst Test
Tests sending requests rapidly to verify rate limiting works at the configured limit.

```bash
python3 tools/debug/rate_limit_debugger.py --scenario burst --limit 3
```

#### Bypass Test  
Tests if multiple parallel connections can bypass rate limits (security vulnerability check).

```bash
python3 tools/debug/rate_limit_debugger.py --scenario bypass --connections 5 --limit 2
```

**Expected Result**: Should detect bypass if multiple server instances allow more than the single limit.

#### Timing Test
Tests sliding window behavior by using up the limit and waiting for window expiry.

```bash
python3 tools/debug/rate_limit_debugger.py --scenario timing --limit 5 --window 2000
```

### Example Output

```
🚨 BYPASS DETECTED! Got 15 requests, expected max 5
   Bypass factor: 3.0x
```

## MCP Protocol Debugger

Tests MCP JSON-RPC protocol communication, handshake, and tool execution.

### Usage

```bash
# Full protocol test
python3 tools/debug/mcp_protocol_debugger.py

# Test specific tool
python3 tools/debug/mcp_protocol_debugger.py --tool get_current_time --verbose

# Test tool with arguments
python3 tools/debug/mcp_protocol_debugger.py \
  --tool add_time \
  --args '{"time":"2024-01-01","amount":1,"unit":"days"}'

# Interactive mode
python3 tools/debug/mcp_protocol_debugger.py --interactive
```

### Interactive Mode

The interactive mode allows real-time debugging of the MCP protocol:

```
🔄 Interactive MCP Debug Mode
========================================
Commands:
  init                  - Initialize connection
  list                  - List tools
  call <tool> [args]    - Call tool
  raw <json>            - Send raw JSON-RPC
  quit                  - Exit

mcp> init
✅ Initialization successful

mcp> list
  get_current_time: Get current time in specified timezone
  add_time: Add duration to a date/time
  ...

mcp> call get_current_time {"timezone": "America/New_York"}
Result: {
  "time": "2025-07-28T15:30:00-04:00",
  "timezone": "America/New_York"
}

mcp> quit
👋 Goodbye!
```

## Common Use Cases

### 1. Server Won't Start
```bash
# Check if server executable exists and runs
python3 tools/debug/mcp_protocol_debugger.py --verbose
```

### 2. Rate Limiting Not Working
```bash
# Test environment variable handling
python3 tools/debug/mcp_env_debugger.py --rate-limit 1 --requests 3 --verbose

# Check for bypasses
python3 tools/debug/rate_limit_debugger.py --scenario bypass
```

### 3. Tool Execution Issues
```bash
# Test specific tool
python3 tools/debug/mcp_protocol_debugger.py --tool your_tool_name --verbose

# Interactive debugging
python3 tools/debug/mcp_protocol_debugger.py --interactive
```

### 4. Protocol Communication Problems
```bash
# Full protocol test with verbose output
python3 tools/debug/mcp_protocol_debugger.py --verbose
```

## Troubleshooting Tips

### Server Not Responding
- Check if `dist/index.js` exists (run `make build`)
- Verify Node.js is installed and in PATH
- Check server stderr output with `--verbose`

### Rate Limiting Issues
- Environment variables may not be read correctly
- Multiple server instances bypass per-instance limits
- Server may need restart after configuration changes

### Tool Execution Failures
- Check tool name spelling with `list` command
- Verify argument types match tool schema
- Use interactive mode to test incrementally

## Integration with Development

These tools complement the existing test infrastructure:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test server behavior with MCP SDK
- **Debug Tools**: Interactive debugging and configuration testing
- **Stress Tests**: Performance and security testing under load

## Security Notes

The rate limit debugger can detect several security vulnerabilities:

- **Parallel Connection Bypass**: Multiple connections multiplying rate limits
- **Rapid Reconnection Bypass**: Resetting limits by reconnecting  
- **Memory Exhaustion**: Unbounded growth of rate limit tracking data

These tools help identify and document these limitations for proper security assessment.

## Contributing

When adding new debug scenarios:

1. Follow the existing tool patterns
2. Add comprehensive help text and examples
3. Include both programmatic and interactive modes where useful
4. Update this README with new capabilities

## Files

- `mcp_env_debugger.py` - Environment variable and configuration testing
- `rate_limit_debugger.py` - Rate limiting functionality and bypass testing  
- `mcp_protocol_debugger.py` - MCP protocol communication testing
- `README.md` - This documentation