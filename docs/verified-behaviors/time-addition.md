# Time Addition with date-fns (Verified 2025-07-18)

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