# MCP Time Server

A comprehensive time manipulation server implementing the Model Context Protocol (MCP) for LLMs like Claude. This server provides powerful time-related operations including timezone conversions, date arithmetic, business day calculations, and more.

## Features

- 🌍 **Timezone Operations**: Convert times between any IANA timezones
- ⏰ **Current Time**: Get current time in any timezone with custom formatting
- ➕➖ **Date Arithmetic**: Add or subtract time periods from dates
- 📊 **Duration Calculations**: Calculate time between dates in various units
- 💼 **Business Days**: Calculate business days excluding weekends and holidays
- 🔄 **Recurring Events**: Find next occurrences of recurring patterns
- 📝 **Flexible Formatting**: Format times in relative, calendar, or custom formats
- 🚀 **High Performance**: Response times < 10ms with intelligent caching
- 🔒 **Rate Limiting**: Configurable rate limits to prevent abuse

## Installation

### Using npm (recommended)

```bash
npm install -g mcp-time-server
```

### Using Claude Code (claude mcp add)

Add the server to Claude Code:

```bash
# For npm-published version (when available)
claude mcp add mcp-time-server

# For local development/testing
claude mcp add /path/to/mcp-time-server/dist/index.js --name time-server
```

### Using Claude Desktop

Manually add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "time-server": {
      "command": "npx",
      "args": ["-y", "mcp-time-server"],
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
npm run build

# Test directly
echo '{"jsonrpc":"2.0","method":"tools/list","id":1,"params":{}}' | node dist/index.js

# Or add to Claude Code for local testing
claude mcp add $(pwd)/dist/index.js --name time-server-local
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
cd mcp-time-server
npm install
npm run build
npm test
```

### Running tests

```bash
npm test                 # Run all tests
npm run test:coverage   # Run with coverage
npm run test:watch      # Run in watch mode
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