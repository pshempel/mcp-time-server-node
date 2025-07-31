# Monthly Recurrence Behavior Verification

**Date**: 2025-01-29  
**Libraries**: date-fns@4.1.0, date-fns-tz@3.2.0

## Key Findings

### 1. Month-End Overflow with `addMonths`
- `addMonths` intelligently handles month-end overflow
- Jan 31 + 1 month = Feb 29 (in leap year) or Feb 28 (non-leap)
- Preserves "last day of month" intent when original day exceeds target month

### 2. `setDate` Behavior with Invalid Days
- `setDate(29)` on Feb in leap year: Feb 29
- `setDate(29)` on Feb in non-leap year: Mar 1 (overflows)
- `setDate(31)` on 30-day month: Overflows to next month

### 3. DST Transitions
- `addMonths` preserves wall clock time across DST
- Feb 15 14:30 EST → Mar 15 14:30 EDT (same wall time)

### 4. Implementation Strategy for "31st of Every Month"
```javascript
const year = targetDate.getFullYear();
const month = targetDate.getMonth();
const lastDay = new Date(year, month + 1, 0).getDate();
const day = Math.min(requestedDay, lastDay);
```

## Design Decisions

1. **Month-end dates** (29, 30, 31) should map to last valid day of target month
2. **Mid-month dates** (1-28) should preserve exact day
3. **Time preservation** should work across DST boundaries
4. **Timezone context** must be maintained throughout calculation