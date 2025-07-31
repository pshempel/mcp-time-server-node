# Time Simulation Testing Strategy

## Overview
Time-based testing requires special strategies to catch edge cases that only occur at specific times or in specific timezones.

## Current Issues We've Encountered
1. **UTC vs Local Date Boundaries**: Tests fail when local date differs from UTC date
2. **Timezone Parsing**: ISO strings without timezone are parsed as UTC, not local
3. **DST Transitions**: Calculations can be off by an hour during transitions
4. **Month/Year Boundaries**: Special handling needed for edge dates

## Testing Strategies

### 1. Time Travel Testing
```javascript
describe('time boundary tests', () => {
  const testTimes = [
    { name: 'midnight local', time: new Date('2025-01-01T00:00:00') },
    { name: 'just before midnight', time: new Date('2025-01-01T23:59:59') },
    { name: 'noon', time: new Date('2025-01-01T12:00:00') },
  ];
  
  test.each(testTimes)('handles $name correctly', ({ time }) => {
    jest.setSystemTime(time);
    // Run tests at this specific time
  });
});
```

### 2. Timezone Matrix Testing
```javascript
// Run same test suite in multiple timezones
const runInTimezone = (tz, testFn) => {
  const originalTZ = process.env.TZ;
  process.env.TZ = tz;
  
  try {
    testFn();
  } finally {
    process.env.TZ = originalTZ;
  }
};
```

### 3. Property-Based Time Testing
```javascript
// Test with random times to find edge cases
import fc from 'fast-check';

test('handles any time correctly', () => {
  fc.assert(
    fc.property(
      fc.date(),
      (date) => {
        // Property: operation should work for any date/time
        const result = daysUntil({ target_date: date });
        expect(typeof result).toBe('number');
      }
    )
  );
});
```

### 4. Snapshot Testing at Key Times
```javascript
// Capture behavior at known problematic times
const PROBLEM_TIMES = [
  '2025-03-09T02:30:00', // During DST spring forward
  '2025-11-02T01:30:00', // During DST fall back
  '2025-12-31T23:59:59', // Year boundary
  '2025-02-28T23:59:59', // Month boundary (non-leap)
];
```

## Implementation Plan

### Phase 1: Enhanced Time Mocking
- Create test utilities for timezone simulation
- Add property-based testing for date operations
- Create edge case test suites

### Phase 2: CI/CD Time Testing
- Run tests in different timezone containers
- Schedule tests to run at different times of day
- Create timezone regression test suite

### Phase 3: Time Chaos Testing
- Randomly change time during test execution
- Test with system clock drift
- Simulate timezone database updates

## Practical Examples

### Testing Timezone Boundaries
```javascript
// Test when it's different days in different timezones
test('handles cross-timezone day boundaries', () => {
  // Set time to 11 PM EST (4 AM UTC next day)
  const estEvening = new Date('2025-01-01T23:00:00-05:00');
  jest.setSystemTime(estEvening);
  
  // In EST, it's Jan 1
  process.env.TZ = 'America/New_York';
  expect(daysUntil({ target_date: '2025-01-01' })).toBe(0); // Today
  
  // In UTC, it's already Jan 2
  process.env.TZ = 'UTC';
  expect(daysUntil({ target_date: '2025-01-01' })).toBe(-1); // Yesterday
});
```

### Testing DST Transitions
```javascript
test('handles DST spring forward', () => {
  // Test the "lost hour" during spring DST
  const beforeDST = new Date('2025-03-09T01:59:59-05:00');
  const afterDST = new Date('2025-03-09T03:00:00-04:00');
  
  // Only 1 minute apart in real time
  const diff = calculateDuration({
    start_time: beforeDST.toISOString(),
    end_time: afterDST.toISOString(),
    unit: 'minutes'
  });
  expect(diff).toBe(1);
});
```

## Tools and Libraries

### Recommended Testing Libraries
1. **@sinonjs/fake-timers**: Advanced time mocking
2. **fast-check**: Property-based testing
3. **timezone-mock**: Mock system timezone (Node.js)
4. **mockdate**: Simple date mocking

### Example Setup
```javascript
// test-utils/time-testing.js
export const withTimezone = (tz, fn) => {
  const original = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    process.env.TZ = original;
  }
};

export const withTime = (dateStr, fn) => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(dateStr));
  try {
    return fn();
  } finally {
    jest.useRealTimers();
  }
};
```

## Best Practices

1. **Always test timezone boundaries**: When it's late evening in one timezone, it's already tomorrow in others
2. **Use consistent date creation**: Prefer `format()` over `toISOString().split('T')[0]`
3. **Test with various locales**: Different regions have different date formats
4. **Document timezone assumptions**: Make it clear what timezone your tests expect
5. **Run CI in UTC**: Provides consistent baseline
6. **Add timezone to error messages**: Help debug when tests fail

## Future Considerations

1. **Leap Second Testing**: How to handle 23:59:60
2. **Historical Timezone Testing**: Timezones change over time
3. **Locale-Specific Testing**: Different calendars (Hebrew, Islamic, etc.)
4. **Performance Testing**: Time operations at scale

## Conclusion

Time testing is complex because:
- We can't truly change system time in tests
- Timezones are system-dependent
- Edge cases only appear at specific times
- Real-world usage spans all timezones

The best approach is a combination of:
- Comprehensive edge case coverage
- Property-based testing for randomization
- Multiple timezone testing
- Clear documentation of assumptions