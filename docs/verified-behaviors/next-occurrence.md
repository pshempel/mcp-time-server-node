# Next Occurrence with date-fns (Verified 2025-07-18)

**Key Findings**:

1. **Recurrence Building Blocks**:
   - `addDays()`, `addWeeks()`, `addMonths()`, `addYears()` for intervals
   - `setDay()`, `setDate()`, `setHours()`, `setMinutes()` for specific values
   - `getDay()` returns 0-6 (Sunday=0, Saturday=6)
   - `getDate()` returns day of month (1-31)

2. **Weekly Recurrence**:
   ```typescript
   // Next occurrence of specific weekday
   const targetDay = 3; // Wednesday
   const currentDay = getDay(date);
   let daysToAdd = (targetDay - currentDay + 7) % 7;
   if (daysToAdd === 0) daysToAdd = 7; // Force next week
   const nextOccurrence = addDays(date, daysToAdd);
   ```

3. **Monthly Edge Cases**:
   - `setDate(date, 31)` on months with < 31 days rolls over to next month
   - Example: `setDate(feb1, 31)` → March 3rd (non-leap year)
   - Safe approach: Check if date rolled over, adjust if needed

4. **Time Handling**:
   - Setting time doesn't change timezone offset
   - Chain setters for precise time: `setHours(setMinutes(date, 30), 14)`
   - Use `isAfter()` to check if target time has passed today

5. **Timezone Considerations**:
   - `toZonedTime()` / `fromZonedTime()` for timezone-aware calculations
   - Setting time operates in the date's current timezone context
   - Days until calculation (`differenceInDays()`) is calendar-based, not affected by DST

6. **Yearly Recurrence**:
   - February 29 → February 28 in non-leap years
   - `addYears()` handles this automatically