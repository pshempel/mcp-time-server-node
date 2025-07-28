# Holiday Timezone Handling

## Issue

When comparing holiday dates with business dates that have timezone context, the comparison can fail because:

1. Holiday dates are created using `new Date(year, month, day)` which creates them in the server's local timezone
2. Business dates might be parsed with a specific timezone using `toDate(dateStr, { timeZone: 'America/Los_Angeles' })`
3. These represent different moments in time if the server timezone differs from the business timezone

## Verified Behavior

### toDateString() Comparison

```javascript
const date1 = new Date(2025, 0, 1); // Local time
const date2 = toDate('2025-01-01', { timeZone: 'America/Los_Angeles' });

// toDateString() returns date in LOCAL timezone, so comparison works for same calendar day
date1.toDateString() === date2.toDateString() // true (both show "Wed Jan 01 2025")
```

### Issue Example

```javascript
// Server in UTC creates holiday at midnight UTC
const holiday = new Date(Date.UTC(2025, 0, 1)); // 2025-01-01T00:00:00.000Z

// Business date in LA timezone at start of day  
const businessDate = toDate('2025-01-01', { timeZone: 'America/Los_Angeles' }); // 2025-01-01T08:00:00.000Z

// These are different moments in time!
```

## Solution

The current implementation using `toDateString()` for comparison actually works correctly because:
- `toDateString()` always returns the date in the local timezone of the JavaScript runtime
- This means it shows the calendar date regardless of the timezone the Date was created with

However, the holidays should be created considering the business timezone context to ensure accurate comparisons when timezone is specified.

## Test Cases

1. Holiday comparison works without timezone
2. Holiday comparison works with timezone specified
3. Holiday comparison works across timezone boundaries