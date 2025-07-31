# Yearly Recurrence Behavior Verification

**Date**: 2025-01-29  
**Libraries**: date-fns@4.1.0, date-fns-tz@3.2.0

## Key Findings

### 1. Basic Yearly Addition
- `addYears` simply adds to the year component
- Preserves month, day, and time

### 2. Leap Year Handling
- Feb 29 + 1 year = Feb 28 (in non-leap years)
- Feb 29 + 4 years = Feb 29 (if target is leap year)
- This matches user expectations for anniversaries

### 3. Current Implementation Analysis
The existing `nextOccurrence` yearly pattern:
- Simply adds 1 year to the current date
- Preserves the exact date/time (with leap year adjustment)
- Does NOT support specific month/day targeting
- Only supports "same date next year" pattern

### 4. Design Decision
Based on the current implementation and tests, YearlyRecurrence should:
1. Support simple yearly addition (current behavior)
2. Optionally support specific month/day targeting (enhancement)
3. Handle Feb 29 → Feb 28 in non-leap years
4. Preserve time across DST boundaries

## Implementation Strategy

```typescript
interface YearlyParams {
  pattern: 'yearly';
  month?: number;      // 0-11, optional for specific month
  dayOfMonth?: number; // 1-31, optional for specific day
  time?: string;       // HH:mm
  timezone?: string;
}
```

If month/dayOfMonth not specified: Same date next year
If specified: Next occurrence of that specific date