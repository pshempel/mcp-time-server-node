# Days Until Calculations - Verified Behavior

## Overview
The `days_until` tool calculates the number of days between now and a target date/event.

## Key Design Decisions

### 1. Calendar Days vs Exact Days
- Use `differenceInCalendarDays` for user-friendly "days until" counting
- This counts calendar days, ignoring time of day
- Example: 11:59 PM today to 12:01 AM tomorrow = 1 day

### 2. Timezone Handling
- If no timezone specified: Parse as local timezone
- Empty string `""`: Parse as UTC
- Specific timezone: Parse in that timezone
- Consistent with server's timezone philosophy

### 3. Input Date Formats
```javascript
// Supported formats:
"2025-12-25"              // Date only - midnight in specified/local timezone
"2025-12-25T15:30:00"     // Date + time in specified/local timezone
"2025-12-25T15:30:00Z"    // UTC time
"2025-12-25T15:30:00-05:00" // Specific timezone offset
"December 25, 2025"       // Natural language (via parseISO)
```

### 4. Return Value
- Positive number: Days in the future
- Zero: Today
- Negative number: Days in the past

### 5. Smart Formatting Options
- `include_time: false` (default): Just return the number
- `include_time: true`: Return formatted string:
  - 0: "Today"
  - 1: "Tomorrow"  
  - -1: "Yesterday"
  - 2+: "in N days"
  - -2 or less: "N days ago"

## Implementation Notes

```javascript
// Core calculation
const daysUntil = differenceInCalendarDays(targetDate, now);

// Smart formatting
if (options.format_result) {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil === -1) return "Yesterday";
  if (daysUntil > 0) return `in ${daysUntil} days`;
  return `${Math.abs(daysUntil)} days ago`;
}
```

## Examples

```javascript
// Simple days until Christmas
days_until({ target_date: "2025-12-25" })
// Returns: 150

// With formatting
days_until({ 
  target_date: "2025-12-25",
  format_result: true 
})
// Returns: "in 150 days"

// Specific timezone event
days_until({
  target_date: "2025-07-04T20:00:00",
  timezone: "America/New_York",
  format_result: true
})
// Returns: "in 7 days"

// Past event
days_until({
  target_date: "2024-12-25",
  format_result: true
})
// Returns: "215 days ago"
```

## Edge Cases

1. **Same day**: Returns 0 regardless of time
2. **DST transitions**: Calendar days handle this correctly
3. **Leap years**: Handled by date-fns
4. **Invalid dates**: Should validate and return error

## Testing Approach

1. Test various date formats
2. Test timezone handling
3. Test formatting options
4. Test past/present/future dates
5. Test edge cases (leap years, DST)