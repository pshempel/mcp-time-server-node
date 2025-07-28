# Date Boundary Behavior with Timezones (Verified 2025-07-19)

## Key Discovery: Date-Only String Parsing

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

## Impact on Business Day Calculations

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

## Testing Implications

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