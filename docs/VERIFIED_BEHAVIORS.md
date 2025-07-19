# Verified Library Behaviors for TDD

This document contains verified behaviors from actual testing, not assumptions.

## date-fns Behaviors (Tested 2025-07-18)

### Date Parsing with parseISO()
**Actual Test Results:**
- `'2024-01-01'`: true (ISO date)
- `'2024-01-01T12:00:00Z'`: true (ISO with time and Z)
- `'2024-01-01T12:00:00+05:30'`: true (ISO with timezone offset)
- `'2024-01-01T12:00:00.123Z'`: true (ISO with milliseconds)
- `'Mon, 01 Jan 2024 12:00:00 GMT'`: false (RFC2822 not supported by parseISO)
- `'1704110400'`: false (Unix timestamp string not supported)
- `'not-a-date'`: false
- `'2024-13-01'`: false (invalid month)
- `'2024-01-32'`: false (invalid day)
- `''`: false (empty string)

### Timezone Validation with date-fns-tz (Updated 2025-07-18)
Using `getTimezoneOffset()` - Returns NaN for invalid timezones:
- `'UTC'`: valid (offset: 0ms)
- `'EST'`: valid (offset: -18000000ms)
- `'EST5EDT'`: valid (offset: -14400000ms)
- `'Invalid/Zone'`: invalid (offset: NaN)
- `'America/New_York'`: valid (offset: -14400000ms)
- `'Europe/London'`: valid (offset: 3600000ms)
- `'Asia/Tokyo'`: valid (offset: 32400000ms)
- `'NotATimezone'`: invalid (offset: NaN)
- `''`: valid (offset: 0ms - defaults to UTC)

**Key Finding**: `getTimezoneOffset()` returns NaN for invalid timezones, making it suitable for validation.

### Timezone Formatting with date-fns-tz (Verified 2025-07-18)

**CRITICAL**: Must use `formatInTimeZone` for proper timezone formatting:

```typescript
// WRONG - always shows system timezone offset
const zonedTime = toZonedTime(now, 'Asia/Tokyo');
format(zonedTime, 'XXX'); // Shows YOUR system offset, not Tokyo's!

// CORRECT - shows target timezone offset
formatInTimeZone(now, 'Asia/Tokyo', 'XXX'); // '+09:00'
formatInTimeZone(now, 'UTC', 'XXX'); // 'Z'
```

**Key Findings**:
- `toZonedTime` + `format` = WRONG (shows system timezone)
- `formatInTimeZone` = CORRECT (shows target timezone)
- UTC displays as 'Z' with 'XXX' format
- Empty string timezone works without error (treats as UTC)

### Native JavaScript Timezone Validation Options (Tested 2025-07-18)
1. **Intl.supportedValuesOf('timeZone')** 
   - Returns array of 428 valid IANA timezones
   - Requires Node 14.18+
   - Always accurate to runtime environment

2. **Intl.DateTimeFormat with try/catch**
   - Throws exception for invalid timezones
   - Works on older Node versions
   - Good for validation

3. **getTimezoneOffset from date-fns-tz**
   - Returns NaN for invalid timezones
   - Already in our dependency stack
   - Fast and reliable

### Unix Timestamp Handling
- Numbers: Multiply by 1000, create Date object
- String numbers: parseInt() then multiply by 1000
- All valid after conversion to Date objects

### Timezone Conversion with date-fns-tz (Verified 2025-07-18)

**Key Findings**:
1. **Input Time Parsing**:
   - ISO with Z (e.g., `2025-07-18T12:00:00.000Z`) - treated as UTC
   - ISO with offset (e.g., `2025-07-18T12:00:00.000+05:30`) - respects the offset
   - ISO without timezone (e.g., `2025-07-18T12:00:00`) - treated as LOCAL time
   - Date only (e.g., `2025-07-18`) - treated as midnight in LOCAL time
   - Unix timestamp strings - NOT valid with parseISO

2. **formatInTimeZone Behavior**:
   - Correctly converts from any timezone to target timezone
   - When input has no timezone, it's interpreted as LOCAL time
   - Always shows the correct offset for the target timezone

3. **Offset Calculation**:
   - `getTimezoneOffset()` returns milliseconds (positive for east of UTC)
   - Difference between zones: `(toOffset - fromOffset) / 1000 / 60` = minutes
   - Example: NY to Tokyo = 780 minutes (13 hours) difference

4. **Format String Support**:
   - Supports all date-fns format strings
   - Default format: `yyyy-MM-dd'T'HH:mm:ss.SSSXXX`
   - Custom formats work as expected

### Correct Timezone Conversion Approach (Verified 2025-07-18)

**Using toDate() for from_timezone handling**:
```typescript
// CORRECT: Treat "2025-07-18T12:00:00" as being in America/New_York
const utcDate = toDate('2025-07-18T12:00:00', { timeZone: 'America/New_York' });
// Result: 2025-07-18T16:00:00.000Z (UTC)

// Then format in target timezone
formatInTimeZone(utcDate, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
// Result: 2025-07-19T01:00:00.000+09:00
```

**Key Points**:
- `toDate(time, { timeZone: from })` correctly interprets the time as being in `from` timezone
- Works with DST transitions correctly
- Input with existing offset (e.g., `2025-07-18T12:00:00.000-05:00`) uses that offset, ignoring from_timezone

### RFC2822 Parsing
- Cannot use 'zzz' token (throws error)
- Must parse without timezone information
- Different format tokens than moment.js

## MCP SDK Behaviors

### Tool Registration (from SDK v1.16.0)
- Uses Zod for parameter validation
- `inputSchema` accepts Zod schemas or plain objects
- Known issues:
  - All-optional parameters can cause validation failures
  - Tools without arguments have type issues

### Error Handling
From SDK source:
- Validates tool output against schema using AJV
- Throws `McpError` with `ErrorCode.InvalidParams` on validation failure
- Skips validation if tool reports error

## Research Methods Used

1. **Direct Library Testing**
   - Created test scripts to verify actual behavior
   - Tested with our exact dependency versions

2. **SDK Source Inspection**
   - Examined TypeScript definitions in node_modules
   - Found actual schemas and types

3. **Official Documentation**
   - GitHub issues and discussions
   - npm package documentation

4. **Context7 Search**
   - Found implementation patterns
   - Identified Zod usage for validation

## Key Learnings for TDD

1. **Never assume library behavior** - Always verify
2. **Test with actual dependencies** - Not theoretical behavior
3. **Document sources** - For future reference
4. **Check for known issues** - GitHub issues are valuable

### Time Addition with date-fns (Verified 2025-07-18)

**Key Findings**:

1. **Addition Functions**:
   - Individual functions: `addYears()`, `addMonths()`, `addDays()`, `addHours()`, `addMinutes()`, `addSeconds()`
   - Generic function: `add()` accepts object with multiple units
   - All functions are immutable - return new Date objects
   - Negative values work for subtraction

2. **Month-end Handling**:
   - Jan 31 + 1 month = Feb 28 (or 29 in leap year)
   - Intelligently handles month boundaries
   - Mar 31 + 1 month = Apr 30 (not May 1)

3. **DST Behavior**:
   - Addition operations work in UTC internally
   - When displaying in timezone, DST is respected
   - Example: Adding 2 hours across spring DST shows correct local time jump

4. **Invalid Operations**:
   - `addDays(date, NaN)` returns Invalid Date
   - `addDays(date, Infinity)` returns Invalid Date
   - No exceptions thrown, just Invalid Date returned

5. **Timezone Context**:
   - Use `toDate(time, { timeZone: tz })` to interpret input in specific timezone
   - Addition happens in UTC
   - Use `formatInTimeZone()` to display result in desired timezone

6. **Input Handling**:
   - Date-only strings are parsed as midnight in system timezone
   - ISO with offset preserves the absolute time
   - Unix timestamps work after conversion to Date

7. **Unit Parameter Mapping**:
   ```typescript
   // For our API unit parameter:
   "years" → addYears() or { years: n }
   "months" → addMonths() or { months: n }
   "days" → addDays() or { days: n }
   "hours" → addHours() or { hours: n }
   "minutes" → addMinutes() or { minutes: n }
   "seconds" → addSeconds() or { seconds: n }
   ```

### Time Subtraction with date-fns (Verified 2025-07-18)

**Key Findings**:

1. **Subtraction Functions**:
   - Individual functions: `subYears()`, `subMonths()`, `subDays()`, `subHours()`, `subMinutes()`, `subSeconds()`
   - **Important**: `subX(date, n)` is exactly equivalent to `addX(date, -n)`
   - All functions are immutable - return new Date objects
   - Negative values in subtraction functions add time (double negative)

2. **Equivalence with Addition**:
   ```typescript
   subDays(date, 5) === addDays(date, -5)  // true
   subMonths(date, 2) === addMonths(date, -2)  // true
   // This holds for all units
   ```

3. **Month-end Handling**:
   - March 31 - 1 month = Feb 28 (or 29 in leap year)
   - Same intelligent boundary handling as addition

4. **DST Behavior**:
   - Subtraction across DST boundaries adjusts hours
   - March 15 - 2 months can result in 11:30 instead of 10:30

5. **Implementation Strategy**:
   - Can reuse `addTime` implementation with negated amounts
   - No need for separate subtraction logic

### Duration Calculation with date-fns (Verified 2025-07-18)

**Key Findings**:

1. **Difference Functions**:
   - `differenceInMilliseconds()`, `differenceInSeconds()`, `differenceInMinutes()`, `differenceInHours()`, `differenceInDays()`
   - All return integers (truncated, not rounded)
   - Negative values when end is before start
   - Order matters: `differenceInX(end, start)`

2. **Truncation Behavior**:
   - 30 minutes = 0 hours (not 0.5)
   - 1.5 days = 1 day (not 2)
   - Always rounds down to nearest integer

3. **Timezone Handling**:
   - Duration calculations work on absolute time (UTC)
   - Times with different timezone representations but same absolute time have 0 duration
   - Use `toDate(time, { timeZone })` to interpret local times in specific timezone

4. **DST Considerations**:
   - Duration respects actual time elapsed, not wall clock time
   - Example: 00:00 to 05:00 across spring DST = 4 actual hours (not 5)

5. **Input Parsing**:
   - Date-only strings parsed as midnight in system timezone
   - ISO with offset preserves absolute time
   - No timezone = system timezone interpretation

6. **Human-Readable Formatting**:
   - `formatDistance()` provides approximate strings ("about 1 year", "1 day")
   - Options: `includeSeconds`, `addSuffix`
   - For precise formatting, manual calculation needed

7. **Unix Timestamp Support**:
   - Convert to Date objects first: `new Date(unix * 1000)`
   - Then use standard difference functions

### Business Days Calculation with date-fns (Verified 2025-07-18)

**Key Findings**:

1. **Built-in Function**:
   - `differenceInBusinessDays()` exists and counts weekdays between dates
   - Returns integer (truncated) number of business days
   - Negative values when end is before start
   - Does NOT handle holidays - only excludes weekends

2. **Weekend Definition**:
   - Saturday (day 6) and Sunday (day 0) are weekends
   - `isWeekend()` returns true for these days
   - Monday-Friday are business days

3. **Counting Behavior**:
   - Counts weekdays between start and end dates
   - Same day = 0 business days
   - Time components are ignored (only dates matter)
   - Invalid dates return NaN

4. **eachDayOfInterval**:
   - Returns array of dates including both start and end (inclusive)
   - Handles reversed dates (end before start) without error
   - Returns empty array for invalid dates
   - Single day interval returns array with 1 date

5. **Holiday Handling**:
   - Must be implemented manually
   - Use `isSameDay()` to check if a date matches a holiday
   - Count holidays that fall on business days separately

6. **Timezone Considerations**:
   - Business day calculation uses date boundaries
   - Times in different timezones might span different dates
   - Use `toDate()` with timezone to interpret local dates
   - `isSameDay()` compares dates in same timezone

7. **Calendar Days**:
   - `differenceInCalendarDays()` counts all days
   - Use for total_days in response
   - Always compare with business days for weekend count

8. **Implementation Strategy**:
   - Use `eachDayOfInterval()` to get all dates
   - Filter with `isWeekend()` for business days
   - Check against holiday array with `isSameDay()`
   - Count different categories separately

### Next Occurrence with date-fns (Verified 2025-07-18)

**Key Findings**:

1. **Recurrence Building Blocks**:
   - `addDays()`, `addWeeks()`, `addMonths()`, `addYears()` for intervals
   - `setDay()`, `setDate()`, `setHours()`, `setMinutes()` for specific values
   - `getDay()` returns 0-6 (Sunday=0, Saturday=6)
   - `getDate()` returns day of month (1-31)

2. **Weekly Recurrence**:
   ```typescript
   // Next occurrence of specific weekday
   const targetDay = 3; // Wednesday
   const currentDay = getDay(date);
   let daysToAdd = (targetDay - currentDay + 7) % 7;
   if (daysToAdd === 0) daysToAdd = 7; // Force next week
   const nextOccurrence = addDays(date, daysToAdd);
   ```

3. **Monthly Edge Cases**:
   - `setDate(date, 31)` on months with < 31 days rolls over to next month
   - Example: `setDate(feb1, 31)` → March 3rd (non-leap year)
   - Safe approach: Check if date rolled over, adjust if needed

4. **Time Handling**:
   - Setting time doesn't change timezone offset
   - Chain setters for precise time: `setHours(setMinutes(date, 30), 14)`
   - Use `isAfter()` to check if target time has passed today

5. **Timezone Considerations**:
   - `toZonedTime()` / `fromZonedTime()` for timezone-aware calculations
   - Setting time operates in the date's current timezone context
   - Days until calculation (`differenceInDays()`) is calendar-based, not affected by DST

6. **Yearly Recurrence**:
   - February 29 → February 28 in non-leap years
   - `addYears()` handles this automatically

### Formatting with date-fns (Verified 2025-07-19)

**Key Findings**:

1. **Relative Formatting**:
   - `formatRelative()` - Returns strings like "tomorrow at 9:30 AM", "last Friday at 5:30 AM"
   - `formatDistance()` - Returns plain duration like "5 days", "2 hours"
   - `formatDistanceToNow()` - Always calculates from current Date.now()
   - `addSuffix: true` adds "ago" or "in" prefix

2. **Calendar-like Output**:
   - `formatRelative()` provides calendar-style formatting
   - Same day: "today at X"
   - Next/previous day: "tomorrow/yesterday at X"
   - Same week: "Friday at X"
   - Different week: shows date

3. **Custom Format Patterns**:
   - All standard date-fns tokens work
   - Invalid tokens are output literally (e.g., 'xyz' → 'xyz')
   - Empty string format causes error
   - Escaped text with single quotes: "'Today is' EEEE" → "Today is Monday"

4. **Common Format Patterns**:
   ```
   yyyy-MM-dd                 → 2025-01-20
   MM/dd/yyyy                 → 01/20/2025
   EEEE, MMMM do, yyyy       → Monday, January 20th, 2025
   h:mm a                    → 9:30 AM
   yyyy-MM-dd'T'HH:mm:ss.SSSXXX → 2025-01-20T09:30:45.123-05:00
   PPpp                      → Jan 20, 2025, 9:30:45 AM
   ```

5. **Timezone Formatting**:
   - Must use `formatInTimeZone()` for correct timezone display
   - `toZonedTime()` + `format()` shows system timezone (WRONG)
   - Pattern 'zzz' shows timezone abbreviation (e.g., "GMT-5")

6. **Error Handling**:
   - Empty format string throws TypeError
   - Invalid date returns "Invalid Date"
   - Unknown tokens output literally, no error

## MCP SDK Server Behaviors (Verified 2025-07-19)

### Server Creation
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

### Request Handler Registration
1. **ListToolsRequestSchema**: method is `tools/list`
2. **CallToolRequestSchema**: method is `tools/call`
3. Handlers are async functions
4. SDK validates requests automatically

### Tool Response Format
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

### Tool Input Schema
- Uses JSON Schema format
- Properties: type, properties, required, description
- SDK validates tool arguments automatically

### Transport
- StdioServerTransport for CLI usage
- Connect with `server.connect(transport)`
- Starts JSON-RPC message loop

### Testing Approach
- Can test handlers directly without transport
- Create mock request objects
- Test tool registration separately from execution

## 9. Rate Limiting in MCP Servers (Verified 2025-07-19)

### Key Findings:

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

### System Timezone Detection (Verified 2025-07-19)

**Key Findings**:

1. **Intl.DateTimeFormat() Method**:
   - `Intl.DateTimeFormat().resolvedOptions().timeZone` returns system timezone
   - Returns valid IANA timezone string (e.g., "America/Indianapolis")
   - Always available in Node.js 14+ (our minimum version)
   - Performance: ~0.24ms per call (should cache)

2. **TZ Environment Variable**:
   - TZ affects `Intl.DateTimeFormat().resolvedOptions().timeZone` directly
   - `TZ=UTC` → system timezone becomes "UTC"
   - `TZ=""` → system timezone becomes "Etc/Unknown"
   - `TZ=Invalid/Zone` → system timezone becomes "undefined" (string)
   - Standard Unix way to set timezone, should be respected

3. **Environment Variable Behavior**:
   - `process.env.VAR` is `undefined` when not set
   - `process.env.VAR` is empty string `""` when set to empty
   - Can distinguish between unset and empty

4. **Timezone Validation**:
   - Empty string `""` is valid timezone (defaults to UTC in date-fns-tz)
   - String `"undefined"` is valid timezone (weird but true)
   - String `"null"` is valid timezone (also weird but true)
   - Use `getTimezoneOffset()` returns NaN for truly invalid timezones

5. **Recommended Precedence**:
   ```
   1. Parameter (if provided and not empty string)
   2. DEFAULT_TIMEZONE env var (if valid)
   3. System timezone via Intl.DateTimeFormat()
   4. UTC (final fallback)
   ```
   Note: TZ env var is automatically respected because it affects Intl.DateTimeFormat()

6. **Backward Compatibility**:
   - Empty string parameter `""` must continue to mean UTC
   - This is different from undefined parameter
   - Critical for maintaining API compatibility

7. **Performance Considerations**:
   - `Intl.DateTimeFormat().resolvedOptions().timeZone` is slow (~0.24ms)
   - Should be called once and cached
   - Config module should handle caching

## Date Boundary Behavior with Timezones (Verified 2025-07-19)

### Key Discovery: Date-Only String Parsing

When parsing date-only strings in different timezones, the resulting dates can shift across day boundaries:

```javascript
// Example: "2025-01-20" parsed in different timezones
toDate('2025-01-20', { timeZone: 'UTC' })
// Result: 2025-01-20T00:00:00.000Z (Monday midnight UTC)

toDate('2025-01-20', { timeZone: 'Asia/Tokyo' })
// Result: 2025-01-19T15:00:00.000Z (Sunday 3PM UTC = Monday midnight Tokyo)

toDate('2025-01-20', { timeZone: 'America/New_York' })
// Result: 2025-01-20T05:00:00.000Z (Monday 5AM UTC = Monday midnight NY)
```

### Impact on Business Day Calculations

**Critical Finding**: When using `eachDayOfInterval` with timezone-parsed dates:
- The interval includes different days depending on timezone
- A Mon-Fri range in one timezone might include Sun-Thu in another
- This affects business day calculations

**Example**:
```javascript
// "2025-01-20" to "2025-01-24" (Mon-Fri)
// In UTC: Returns Mon-Fri (5 business days)
// In Asia/Tokyo: Returns Sun-Thu (4 business days, 1 weekend day)
```

### Testing Implications

1. **Mock Configuration Must Match System**:
   - If system timezone is "America/Indianapolis", mocks must use same
   - Mocking UTC when system uses local timezone causes test failures

2. **Mixed Date Formats Create Edge Cases**:
   - Plain date string: Uses specified timezone
   - Unix timestamp: Always UTC
   - Mixing these can create unexpected intervals

3. **Test Expectations Must Account for Shifts**:
   - Jan 13-17 might be 5 days or 4 days depending on timezone
   - Weekend days might appear where not expected

## Timezone Default Behavior (Verified 2025-07-19)

### Three-Way Timezone Resolution

All MCP Time Server tools that accept a timezone parameter follow this precedence:

1. **Empty String (`""`)** → Always resolves to **UTC**
   - Maintains backward compatibility
   - Explicit way to request UTC
   - Example: `{ timezone: "" }` → uses UTC

2. **Undefined/Not Provided** → Uses **System Timezone**
   - New default behavior as of Session 017
   - Detects system timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
   - Example: `{}` → uses "America/Indianapolis" (or whatever system is set to)

3. **Any Other Value** → Uses **Specified Timezone**
   - Standard IANA timezone names
   - Example: `{ timezone: "Asia/Tokyo" }` → uses Asia/Tokyo

### Implementation Pattern

All tools use this consistent pattern:
```typescript
const config = getConfig();
const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);
```

### Rationale

This design ensures:
- **Backward Compatibility**: Existing code using empty strings for UTC continues to work
- **User Convenience**: Most users get their local timezone by default
- **Explicit Control**: Users can still specify any timezone they need
- **Unix Timestamp Handling**: Empty string → UTC is important for timestamp processing

### formatRelative with Timezones (Verified 2025-07-19)

**Critical Discovery**: `formatRelative()` cannot be used for timezone-aware relative formatting.

**Key Findings**:

1. **formatRelative Always Uses System Timezone**:
   - Regardless of the Date objects passed to it
   - No way to specify target timezone
   - Always formats times in the system's local timezone

2. **toDate() Behavior**:
   - `toDate(date, { timeZone: 'X' })` does NOT convert the date
   - Returns the same Date object (verified with ===)
   - The timezone option is misleading/useless for this use case

3. **The Broken Approach**:
   ```typescript
   // This DOES NOT WORK
   const zonedDate = toDate(date, { timeZone: timezone });
   const zonedNow = toDate(now, { timeZone: timezone });
   const timeDiff = zonedDate.getTime() - zonedNow.getTime();
   const adjustedDate = new Date(Date.now() + timeDiff);
   formatRelative(adjustedDate, new Date());
   // Always returns dates formatted in system timezone
   ```

4. **Correct Implementation Requires Manual Building**:
   ```typescript
   // Format time in target timezone
   const timeStr = formatInTimeZone(date, timezone, 'h:mm a');
   const dayOfWeek = formatInTimeZone(date, timezone, 'EEEE');
   
   // Calculate days difference
   const msPerDay = 24 * 60 * 60 * 1000;
   const daysDiff = Math.round((baseDate - date) / msPerDay);
   
   // Build relative string manually
   if (daysDiff === 0) return `today at ${timeStr}`;
   if (daysDiff === 1) return `yesterday at ${timeStr}`;
   if (daysDiff === -1) return `tomorrow at ${timeStr}`;
   // etc.
   ```

5. **Day Difference Calculation**:
   - Must use UTC dates for accurate day counting
   - Consider using start of day for both dates
   - Round the result to handle DST transitions

6. **Implementation Strategy**:
   - Cannot use `formatRelative()` at all
   - Must implement custom logic
   - Use `formatInTimeZone()` for time formatting
   - Build relative strings based on day differences

## Next Steps Before Writing Tests

For each tool specification:
1. Research date-fns behavior for that specific operation
2. Test edge cases with actual code
3. Verify timezone handling with date-fns-tz
4. Document findings here
5. Only then write tests