# Business Days Calculation with date-fns (Verified 2025-07-18)

**Key Findings**:

1. **Built-in Function**:
   - `differenceInBusinessDays()` exists and counts weekdays between dates
   - Returns integer (truncated) number of business days
   - Negative values when end is before start
   - Does NOT handle holidays - only excludes weekends

2. **Weekend Definition**:
   - Saturday (day 6) and Sunday (day 0) are weekends
   - `isWeekend()` returns true for these days
   - Monday-Friday are business days

3. **Counting Behavior**:
   - Counts weekdays between start and end dates
   - Same day = 0 business days
   - Time components are ignored (only dates matter)
   - Invalid dates return NaN

4. **eachDayOfInterval**:
   - Returns array of dates including both start and end (inclusive)
   - Handles reversed dates (end before start) without error
   - Returns empty array for invalid dates
   - Single day interval returns array with 1 date

5. **Holiday Handling**:
   - Must be implemented manually
   - Use `isSameDay()` to check if a date matches a holiday
   - Count holidays that fall on business days separately

6. **Timezone Considerations**:
   - Business day calculation uses date boundaries
   - Times in different timezones might span different dates
   - Use `toDate()` with timezone to interpret local dates
   - `isSameDay()` compares dates in same timezone

7. **Calendar Days**:
   - `differenceInCalendarDays()` counts all days
   - Use for total_days in response
   - Always compare with business days for weekend count

8. **Implementation Strategy**:
   - Use `eachDayOfInterval()` to get all dates
   - Filter with `isWeekend()` for business days
   - Check against holiday array with `isSameDay()`
   - Count different categories separately