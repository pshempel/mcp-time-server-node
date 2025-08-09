# MCP Time Server - Project Overview

## About

The MCP Time Server is a comprehensive time manipulation service that implements the Model Context Protocol (MCP) to provide time-related operations for LLMs like Claude. Built with TypeScript and following best practices, it offers reliable time operations with high performance.

## Features

### 8 Time Operation Tools

1. **`get_current_time`** - Get current time in any timezone
2. **`convert_timezone`** - Convert times between timezones
3. **`add_time`** - Add duration to dates
4. **`subtract_time`** - Subtract duration from dates
5. **`calculate_duration`** - Calculate time between dates
6. **`get_business_days`** - Calculate business days
7. **`next_occurrence`** - Find next recurring event
8. **`format_time`** - Format times in various ways

### Core Infrastructure

- MCP protocol implementation
- JSON-RPC 2.0 compliance
- Sliding window rate limiting
- In-memory caching with TTL
- Comprehensive error handling
- TypeScript with strict typing

## Performance Characteristics

- **Response Times**: < 10ms for cached responses
- **Rate Limiting**: Configurable (default: 100 req/min)
- **Cache Size**: Limited to 10MB
- **Concurrent Requests**: Fully supported
- **Memory Usage**: Optimized with sliding window

## Dependencies

### Production
- `@modelcontextprotocol/sdk`: ^1.16.0
- `date-fns`: ^4.1.0
- `date-fns-tz`: ^3.2.0
- `node-cache`: ^5.1.2

### Requirements
- Node.js 18.0.0 or higher
- TypeScript 5.0+

## Project Structure

```
mcp-time-server/
├── src/              # Source code
│   ├── tools/        # Tool implementations
│   ├── cache/        # Caching layer
│   ├── utils/        # Utilities
│   └── types/        # TypeScript types
├── tests/            # Test suite
├── examples/         # Usage examples
├── docs/             # Documentation
└── dist/             # Build output
```

## Quality Assurance

- **317 total tests** (all passing)
- **100% tool coverage**
- Built using Test-Driven Development (TDD)
- Strict TypeScript configuration
- ESLint and Prettier for code quality
- Comprehensive error handling

## Installation

See [README.md](../README.md) for installation and usage instructions.

## License

MIT License - see [LICENSE](../LICENSE) file for details.