# Duration Calculation with date-fns (Verified 2025-07-18)

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