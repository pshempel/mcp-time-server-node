# Date and Timezone Design Reference

## Core Design Philosophy

This MCP Time Server follows a user-friendly timezone philosophy:

1. **Undefined/missing timezone** → System timezone (local time)
2. **Empty string `""`** → UTC (explicit Unix convention)
3. **Any other value** → That specific timezone

## Critical Date Creation Patterns

### 1. Holiday Dates (Local Timezone)
```javascript
// Holidays are created in LOCAL timezone
const holiday = new Date(2025, 0, 1); // January 1, 2025 at midnight LOCAL
```

### 2. Test Date Creation Pitfalls
```javascript
// WRONG - Creates UTC date which may be different day in local timezone
const testDate = new Date('2025-01-01'); // UTC midnight = Dec 31 in US timezones!

// CORRECT - Creates local timezone date matching holiday creation
const testDate = new Date(2025, 0, 1); // Local midnight
```

### 3. ISO String Parsing
```javascript
// ISO strings WITHOUT timezone = UTC (NOT local!)
new Date('2025-01-01')           // 2025-01-01T00:00:00.000Z (UTC)
new Date('2025-01-01T00:00:00')  // 2025-01-01T00:00:00.000Z (UTC)

// ISO strings WITH timezone = That timezone
new Date('2025-01-01T00:00:00-05:00')  // Eastern time

// Local timezone constructor
new Date(2025, 0, 1)  // 2025-01-01 at midnight in LOCAL timezone
```

## Why This Matters

### The Problem
When you create a date with `new Date('2025-01-01')` in Eastern time:
- It creates `2025-01-01T00:00:00.000Z` (UTC midnight)
- In Eastern time, this is `2024-12-31T19:00:00-05:00` (Dec 31 at 7 PM!)
- Comparing with a holiday created as `new Date(2025, 0, 1)` fails

### The Solution
Always match date creation patterns:
- Holidays use local timezone constructor: `new Date(year, month, day)`
- Tests must use same pattern: `new Date(2025, 0, 1)` not `new Date('2025-01-01')`

## Testing Guidelines

### DO ✅
```javascript
// Testing holidays
expect(isHoliday(new Date(2025, 0, 1), 'US')).toBe(true);

// Testing with specific times
expect(isHoliday(new Date(2025, 0, 1, 10, 30), 'US')).toBe(true);

// Comparing dates in tests
const holiday = getHolidaysForYear('US', 2025)[0];
expect(holiday.date.getFullYear()).toBe(2025);
expect(holiday.date.getMonth()).toBe(0); // January
expect(holiday.date.getDate()).toBe(1);
```

### DON'T ❌
```javascript
// Creates UTC date, not local
expect(isHoliday(new Date('2025-01-01'), 'US')).toBe(true);

// Comparing ISO strings can fail due to timezone differences
expect(holiday.date.toISOString()).toBe('2025-01-01T00:00:00.000Z');
```

## Quick Reference Checklist

Before writing holiday-related tests:

1. **Remember**: Holidays are created in LOCAL timezone
2. **Use**: `new Date(year, month, day)` for test dates
3. **Avoid**: `new Date('YYYY-MM-DD')` which creates UTC dates
4. **Compare**: Using `toDateString()` for day comparison (timezone-safe)
5. **Test**: Both with and without timezone parameters

## Common Scenarios

### Scenario 1: Testing if a date is a holiday
```javascript
// Correct
const jan1 = new Date(2025, 0, 1);
expect(isHoliday(jan1, 'US')).toBe(true);
```

### Scenario 2: Verifying holiday dates
```javascript
// Correct - compare components
const holidays = getHolidaysForYear('US', 2025);
const newYear = holidays[0];
expect(newYear.date.getMonth()).toBe(0);
expect(newYear.date.getDate()).toBe(1);

// Also correct - toDateString() comparison
expect(newYear.date.toDateString()).toBe('Wed Jan 01 2025');
```

### Scenario 3: Business days with timezones
```javascript
// When timezone is specified, holidays still work
const businessDays = getBusinessDays(
  '2024-12-24',
  '2025-01-02',
  { country: 'US', timezone: 'America/New_York' }
);
// Correctly excludes Dec 25 and Jan 1 holidays
```

## Summary

The key insight: Our holiday system uses LOCAL timezone dates, so tests must create dates the same way. This is different from some time servers that might use UTC for everything, but it makes the API more intuitive for users who think in their local time.

Remember: When someone says "is January 1st a holiday?", they mean January 1st in their timezone, not UTC January 1st.