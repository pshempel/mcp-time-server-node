# MCP Time Server Node

A comprehensive Node.js time manipulation server implementing the Model Context Protocol (MCP) for LLMs like Claude. This server provides powerful time-related operations including timezone conversions, date arithmetic, business day calculations, and more.

## Features

- 🌍 **Timezone Operations**: Convert times between any IANA timezones
- ⏰ **Current Time**: Get current time in any timezone with custom formatting
- ➕➖ **Date Arithmetic**: Add or subtract time periods from dates
- 📊 **Duration Calculations**: Calculate time between dates in various units
- 💼 **Business Days**: Calculate business days excluding weekends and holidays
- ⏱️ **Business Hours**: Calculate working hours between timestamps with timezone support
- 🔄 **Recurring Events**: Find next occurrences of recurring patterns
- 📝 **Flexible Formatting**: Format times in relative, calendar, or custom formats
- 📅 **Days Until**: Calculate days until any date or event
- 🚀 **High Performance**: Response times < 10ms with intelligent caching
- 🔒 **Security Hardened**: Input validation, cache key hashing, ESLint security rules
- 🛡️ **Rate Limiting**: Configurable rate limits to prevent abuse
- ✅ **Thoroughly Tested**: 703+ tests with 100% coverage

## Installation

### Using npm (recommended)

```bash
npm install -g mcp-time-server-node
```

### Using Claude Code (claude mcp add)

Add the server to Claude Code:

```bash
# For npm-published version (when available)
claude mcp add mcp-time-server-node
```
```bash
# For local development/testing
claude mcp add tim-server /path/to/mcp-time-server-node/dist/index.js
```

### Using Claude Desktop

Manually add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "time-server": {
      "command": "npx",
      "args": ["-y", "mcp-time-server-node"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Local Testing

For testing before npm publish:

```bash
# Build the project
make build
```
```bash
# Test directly
echo '{"jsonrpc":"2.0","method":"tools/list","id":1,"params":{}}' | node dist/index.js
```
```bash
# Or add to Claude Code for local testing
cd mcp-time-server-node
claude mcp add time-server-local $(pwd)/dist/index.js 
``` 
## Available Tools

### 1. `get_current_time`
Get the current time in any timezone.

**Parameters:**
- `timezone` (optional): IANA timezone name (default: "UTC")
- `format` (optional): date-fns format string
- `include_offset` (optional): Include UTC offset (default: true)

**Example:**
```json
{
  "timezone": "America/New_York",
  "format": "yyyy-MM-dd HH:mm:ss"
}
```

### 2. `convert_timezone`
Convert time between timezones.

**Parameters:**
- `time` (required): Input time in ISO format or parseable string
- `from_timezone` (required): Source IANA timezone
- `to_timezone` (required): Target IANA timezone
- `format` (optional): Output format string

**Example:**
```json
{
  "time": "2025-01-20T15:00:00Z",
  "from_timezone": "UTC",
  "to_timezone": "Asia/Tokyo"
}
```

### 3. `add_time`
Add a duration to a date/time.

**Parameters:**
- `time` (required): Base time
- `amount` (required): Amount to add
- `unit` (required): Unit ("years", "months", "days", "hours", "minutes", "seconds")
- `timezone` (optional): Timezone for calculation

**Example:**
```json
{
  "time": "2025-01-20",
  "amount": 3,
  "unit": "days"
}
```

### 4. `subtract_time`
Subtract a duration from a date/time.

**Parameters:**
- Same as `add_time`

### 5. `calculate_duration`
Calculate the duration between two times.

**Parameters:**
- `start_time` (required): Start time
- `end_time` (required): End time
- `unit` (optional): Output unit ("auto", "milliseconds", "seconds", "minutes", "hours", "days")
- `timezone` (optional): Timezone for parsing

**Example:**
```json
{
  "start_time": "2025-01-20T09:00:00",
  "end_time": "2025-01-20T17:30:00"
}
```

### 6. `get_business_days`
Calculate business days between dates.

**Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date
- `exclude_weekends` (optional): Exclude Saturdays and Sundays (default: true)
- `holidays` (optional): Array of holiday dates in ISO format
- `timezone` (optional): Timezone for calculation

**Example:**
```json
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "holidays": ["2025-01-01", "2025-01-20"]
}
```

### 7. `next_occurrence`
Find the next occurrence of a recurring event.

**Parameters:**
- `pattern` (required): "daily", "weekly", "monthly", or "yearly"
- `start_from` (optional): Start searching from this date (default: now)
- `day_of_week` (optional): For weekly pattern (0-6, where 0 is Sunday)
- `day_of_month` (optional): For monthly pattern (1-31)
- `time` (optional): Time in HH:mm format
- `timezone` (optional): Timezone for calculation

**Example:**
```json
{
  "pattern": "weekly",
  "day_of_week": 1,
  "time": "09:00"
}
```

### 8. `format_time`
Format time in various human-readable formats.

**Parameters:**
- `time` (required): Time to format
- `format` (required): "relative", "calendar", or "custom"
- `custom_format` (optional): Format string when using "custom" format
- `timezone` (optional): Timezone for display

**Example:**
```json
{
  "time": "2025-01-20T15:00:00Z",
  "format": "relative"
}
```

### 9. `calculate_business_hours`
Calculate business hours between two times.

**Parameters:**
- `start_time` (required): Start time
- `end_time` (required): End time
- `business_hours` (optional): Business hours definition (default: 9 AM - 5 PM)
  - Can be a single object: `{ start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }`
  - Or weekly schedule: `{ 0: null, 1: { start: {...}, end: {...} }, ... }` (0=Sunday, 6=Saturday)
- `timezone` (optional): Timezone for calculation
- `holidays` (optional): Array of holiday dates
- `include_weekends` (optional): Include weekends in calculation (default: false)

**Example:**
```json
{
  "start_time": "2025-01-20T08:00:00",
  "end_time": "2025-01-24T18:00:00",
  "business_hours": {
    "start": { "hour": 9, "minute": 0 },
    "end": { "hour": 17, "minute": 30 }
  },
  "holidays": ["2025-01-22"],
  "timezone": "America/New_York"
}
```

### 10. `days_until`
Calculate days until a target date or event.

**Parameters:**
- `target_date` (required): Target date (ISO string, natural language like "next Christmas", or Unix timestamp)
- `timezone` (optional): Timezone for calculation (default: system timezone)
- `format_result` (optional): Return formatted string instead of number (default: false)

**Example:**
```json
{
  "target_date": "2025-12-25",
  "timezone": "America/New_York"
}
```

## Environment Variables

- `NODE_ENV`: Set to "production" for production use
- `RATE_LIMIT`: Maximum requests per minute (default: 100)
- `RATE_LIMIT_WINDOW`: Rate limit window in milliseconds (default: 60000)
- `CACHE_SIZE`: Maximum cache entries (default: 10000)
- `DEFAULT_TIMEZONE`: Override system timezone detection (e.g., "America/New_York")
- `MAX_LISTENERS`: Maximum concurrent requests (default: 20, minimum: 10)

## Performance

- All operations complete in < 10ms (after initial load)
- Intelligent caching reduces repeated calculations
- Sliding window rate limiting prevents abuse
- Memory-efficient implementation

## Error Handling

The server returns structured errors with codes:
- `INVALID_TIMEZONE`: Invalid timezone specified
- `INVALID_DATE_FORMAT`: Cannot parse the provided date
- `INVALID_UNIT`: Invalid time unit specified
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_RECURRENCE_PATTERN`: Invalid recurrence pattern

## Development

### Building from source

```bash
git clone https://github.com/pshempel/mcp-time-node.git
cd mcp-time-server-node
make setup    # Install dependencies and build
make test     # Run all tests
```

### Running tests

```bash
make test         # Run all tests
make coverage     # Run with coverage report
make test-watch   # Run in watch mode for TDD

# If tests fail unexpectedly:
make test-quick   # Fix Jest issues and run tests
make reset        # Full environment reset
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Author

pshempel

## Acknowledgments

Built with:
- [Model Context Protocol SDK](https://github.com/anthropics/model-context-protocol)
- [date-fns](https://date-fns.org/) for date manipulation
- [date-fns-tz](https://github.com/marnusw/date-fns-tz) for timezone support