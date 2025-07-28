# Time Subtraction with date-fns (Verified 2025-07-18)

**Key Findings**:

1. **Subtraction Functions**:
   - Individual functions: `subYears()`, `subMonths()`, `subDays()`, `subHours()`, `subMinutes()`, `subSeconds()`
   - **Important**: `subX(date, n)` is exactly equivalent to `addX(date, -n)`
   - All functions are immutable - return new Date objects
   - Negative values in subtraction functions add time (double negative)

2. **Equivalence with Addition**:
   ```typescript
   subDays(date, 5) === addDays(date, -5)  // true
   subMonths(date, 2) === addMonths(date, -2)  // true
   // This holds for all units
   ```

3. **Month-end Handling**:
   - March 31 - 1 month = Feb 28 (or 29 in leap year)
   - Same intelligent boundary handling as addition

4. **DST Behavior**:
   - Subtraction across DST boundaries adjusts hours
   - March 15 - 2 months can result in 11:30 instead of 10:30

5. **Implementation Strategy**:
   - Can reuse `addTime` implementation with negated amounts
   - No need for separate subtraction logic