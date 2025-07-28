# Verified Behaviors Index

This directory contains verified library behaviors from actual testing, not assumptions. Each file focuses on a specific topic for easier reference.

## Library Versions Used for Testing

- **date-fns**: ^4.1.0
- **date-fns-tz**: ^3.2.0
- **@modelcontextprotocol/sdk**: ^1.16.0
- **Node.js**: 14+ (minimum version)

*Note: Behaviors were verified in 2025-07-18 and 2025-07-19 with these versions.*

## date-fns Core Behaviors
- [Date Parsing with parseISO()](./date-parsing-parseISO.md)
- [Unix Timestamp Handling](./unix-timestamp-handling.md)
- [RFC2822 Parsing](./rfc2822-parsing.md)

## Timezone Operations
- [Timezone Validation with date-fns-tz](./timezone-validation.md)
- [Native JavaScript Timezone Validation Options](./native-timezone-validation.md)
- [Timezone Formatting with date-fns-tz](./timezone-formatting.md)
- [Timezone Conversion with date-fns-tz](./timezone-conversion.md)
- [Correct Timezone Conversion Approach](./timezone-conversion-approach.md)
- [System Timezone Detection](./system-timezone-detection.md)
- [Timezone Default Behavior](./timezone-default-behavior.md)
- [Date Boundary Behavior with Timezones](./date-boundary-behavior.md)
- [formatRelative with Timezones](./formatRelative-timezones.md)

## Time Operations
- [Time Addition with date-fns](./time-addition.md)
- [Time Subtraction with date-fns](./time-subtraction.md)
- [Duration Calculation with date-fns](./duration-calculation.md)

## Business Operations
- [Business Days Calculation with date-fns](./business-days-calculation.md)
- [Business Hours Calculations with date-fns](./business-hours-calculations.md)

## Recurring Events
- [Next Occurrence with date-fns](./next-occurrence.md)

## Formatting
- [Formatting with date-fns](./formatting-date-fns.md)

## MCP SDK Behaviors
- [Tool Registration](./mcp-tool-registration.md)
- [Error Handling](./mcp-error-handling.md)
- [MCP SDK Server Behaviors](./mcp-server-behaviors.md)
- [Rate Limiting in MCP Servers](./rate-limiting-mcp.md)

## Holiday Support
- [Holiday Calculations with date-fns](./holiday-calculations.md)

## Meta
- [Research Methods Used](./research-methods.md)
- [Key Learnings for TDD](./key-learnings-tdd.md)
- [Next Steps Before Writing Tests](./next-steps-testing.md)