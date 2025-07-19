# Claude Code MCP Time Server Setup

## Build Status
✅ Project successfully built and tested
- 365 tests passing
- MCP protocol verified working
- Server responds correctly to initialize requests

## Setup Instructions

### 1. Add to Claude Code

Run this command in your terminal:
```bash
claude mcp add time-server-test node $PWD/src/local/time-node_tdd/dist/index.js
```

### 2. Verify Installation

After adding, Claude should have access to 8 time-related tools:

1. **get_current_time** - Get current time in any timezone (defaults to system timezone)
2. **convert_timezone** - Convert time between timezones
3. **add_time** - Add duration to a date/time
4. **subtract_time** - Subtract duration from a date/time
5. **calculate_duration** - Calculate duration between two times
6. **get_business_days** - Calculate business days between dates
7. **next_occurrence** - Find next occurrence of a recurring event
8. **format_time** - Format time in various human-readable formats

### 3. Test the Tools

Once added, you can test with commands like:
- "What time is it?"
- "Convert 3pm EST to PST"
- "Add 5 days to today"
- "How many business days between Christmas and New Year?"

### 4. Configuration

The server uses these environment variables (all optional):
- `NODE_ENV` - Set to 'production' for production use
- `CACHE_SIZE` - Maximum cache entries (default: 10000)
- `RATE_LIMIT` - Requests per minute (default: 100)
- `DEFAULT_TIMEZONE` - Override system timezone detection
- `MAX_LISTENERS` - Maximum concurrent requests (default: 20, minimum: 10)

### 5. Development Mode

For development with hot reload:
```bash
npm run dev
```

### 6. Troubleshooting

If the server doesn't appear in Claude:
1. Ensure the path is absolute: `$PWD/src/local/time-node_tdd`
2. Check that `dist/index.js` exists and is executable
3. Try running manually: `node $PWD/src/local/time-node_tdd/dist/index.js`
4. Check Claude Code logs for any errors

## Server Details

- **Name**: mcp-time-server-node
- **Version**: 1.0.0
- **Protocol**: MCP v2025-06-18
- **Entry Point**: dist/index.js
- **System Timezone**: Automatically detected (empty string in params = system timezone)