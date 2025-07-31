# Time Testing Implementation Guide

## The Problem We Just Discovered

Our `daysUntil` tests were passing when run during the day but failing at night because:
```javascript
// At 9:43 PM Eastern on July 28:
new Date()                          // July 28, 9:43 PM Eastern
new Date().toISOString()            // July 29, 1:43 AM UTC
.toISOString().split('T')[0]        // "2025-07-29" (wrong day!)
```

## Immediate Actions

### 1. Fix Existing Tests (✅ Done)
Replace `toISOString().split('T')[0]` with `format(date, 'yyyy-MM-dd')`

### 2. Add Boundary Tests
```javascript
// Add to each date-related test file
describe('timezone boundary behavior', () => {
  it('handles late evening correctly', () => {
    jest.setSystemTime(new Date('2025-01-01T23:00:00-05:00'));
    // Run the test
  });
});
```

### 3. Create Time Test Checklist
Before committing any date-related code:
- [ ] Test at midnight
- [ ] Test at 11:59 PM
- [ ] Test when UTC date ≠ local date
- [ ] Test with DST transitions
- [ ] Test with different timezones

## Long-term Strategy

### Phase 1: Local Testing (Now)
1. Add `timezone-boundaries.test.ts` for edge cases
2. Use `jest.setSystemTime()` to simulate problematic times
3. Create test utilities for common scenarios

### Phase 2: CI Enhancement (Next Sprint)
```yaml
# .github/workflows/time-edge-tests.yml
name: Time Edge Case Tests
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  pull_request:
    paths:
      - 'src/tools/*Time*.ts'
      - 'src/tools/*days*.ts'
      - 'src/tools/*business*.ts'
```

### Phase 3: Continuous Monitoring
- Add telemetry for timezone-related errors
- Log when calculations cross date boundaries
- Alert on timezone calculation discrepancies

## Practical Testing Patterns

### Pattern 1: The Time Bracket Test
```javascript
// Test same operation at multiple times
[0, 6, 12, 18, 23].forEach(hour => {
  it(`works correctly at ${hour}:00`, () => {
    const testTime = new Date();
    testTime.setHours(hour, 0, 0, 0);
    jest.setSystemTime(testTime);
    
    // Your test here
  });
});
```

### Pattern 2: The Timezone Sandwich
```javascript
// Test with early and late timezone
it('handles timezone extremes', () => {
  // Baker Island (UTC-12)
  process.env.TZ = 'Pacific/Baker';
  const bakerResult = daysUntil({ target_date: '2025-12-25' });
  
  // Line Islands (UTC+14)
  process.env.TZ = 'Pacific/Kiritimati';
  const lineResult = daysUntil({ target_date: '2025-12-25' });
  
  // Should differ by at most 1 day
  expect(Math.abs(bakerResult - lineResult)).toBeLessThanOrEqual(1);
});
```

### Pattern 3: The DST Trap Detector
```javascript
// Catch DST-related bugs
const DST_DATES = {
  US_SPRING: '2025-03-09T02:00:00',
  US_FALL: '2025-11-02T02:00:00',
  EU_SPRING: '2025-03-30T02:00:00',
  EU_FALL: '2025-10-26T02:00:00',
};

Object.entries(DST_DATES).forEach(([name, date]) => {
  it(`handles ${name} DST transition`, () => {
    jest.setSystemTime(new Date(date));
    // Your test
  });
});
```

## What We Can't Test (But Should Document)

1. **Real Timezone Changes**: We can't actually change the system timezone in tests
2. **Leap Seconds**: JavaScript doesn't handle them
3. **Future DST Rule Changes**: Governments change DST rules
4. **Every Possible Moment**: We can only test samples

## Recommended Tools

### For Now
- `jest.useFakeTimers()` - Good enough for most cases
- `date-fns/format` - Consistent date formatting
- Manual edge case tests - Like we just added

### For Future
- `@sinonjs/fake-timers` - More advanced time control
- `fast-check` - Property-based testing for dates
- Docker containers with different TZ settings

## The Golden Rules

1. **Never trust** `toISOString()` for date-only operations
2. **Always test** at 11 PM in your local timezone  
3. **Document** timezone assumptions in tests
4. **Use `format()`** for consistent date strings
5. **Test both** UTC and local timezone scenarios

## Quick Win: Add This to Every Date Test

```javascript
// Add to setupTests.js or each test file
beforeEach(() => {
  // Log warning if running at a problematic time
  const now = new Date();
  const localDate = format(now, 'yyyy-MM-dd');
  const utcDate = now.toISOString().split('T')[0];
  
  if (localDate !== utcDate) {
    console.warn(`⚠️ Testing at timezone boundary: Local=${localDate}, UTC=${utcDate}`);
  }
});
```

## Conclusion

Time bugs are insidious because they:
- Only appear at certain times
- Work fine in most timezones
- Pass in CI but fail locally (or vice versa)
- Are hard to reproduce

The best defense is:
1. Defensive coding (use `format()`)
2. Comprehensive testing (multiple times/zones)
3. Good monitoring (log timezone issues)
4. Clear documentation (state assumptions)

Remember: If a test involves dates, it needs timezone edge case testing!