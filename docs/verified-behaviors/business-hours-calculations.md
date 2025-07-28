# Business Hours Calculations with date-fns (Verified 2025-07-19)

**Key Findings**:

1. **Business Hours Definition**:
   - Standard: 9:00 AM - 5:00 PM (8 hours per day)
   - Can be customized per day of week
   - Stored as hour/minute objects: `{ hour: 9, minute: 0 }`

2. **Time Within Business Hours Check**:
   - Use `isWithinInterval()` with start/end times
   - Must use `setHours()` and `setMinutes()` to set business hours on specific date
   - Edge cases: 9:00 AM and 5:00 PM are both considered within business hours
   - One minute before close (4:59 PM) is within hours

3. **Business Hours Calculation Algorithm**:
   ```typescript
   // For each day in interval:
   1. Skip weekends (unless business operates on weekends)
   2. Skip holidays
   3. Set business hours for that day
   4. For first day: use actual start time if within hours
   5. For last day: use actual end time if within hours
   6. Calculate minutes between adjusted start/end
   7. Sum all business minutes
   ```

4. **Edge Cases for Multi-Day Calculations**:
   - Start after business hours: Skip first day
   - End before business hours: Skip last day
   - Start/end on weekend: No business hours
   - Start/end on holiday: No business hours

5. **Different Hours Per Day**:
   - Use object keyed by day number (0-6, Sunday=0)
   - null value means closed that day
   - Example: Friday half-day `{ hour: 13, minute: 0 }` for 1 PM close

6. **Timezone Handling**:
   - Business hours are timezone-specific
   - NYC 9 AM = Tokyo midnight (next day)
   - Use `toDate()` with timezone to interpret local business hours
   - Critical for international business calculations

7. **Holiday Integration**:
   - Holidays override business hours (0 hours on holidays)
   - Use `isSameDay()` to check if date is holiday
   - Should check holidays AFTER weekend check

8. **Implementation Requirements**:
   - Need new tool: `calculate_business_hours`
   - Input: start/end times, business hours definition, timezone
   - Output: total business hours/minutes, breakdown by day
   - Support custom schedules per day

9. **date-fns Functions Used**:
   - `setHours()`, `setMinutes()` - Set business hours
   - `isWithinInterval()` - Check if time within hours
   - `eachDayOfInterval()` - Iterate days
   - `differenceInMinutes()` - Calculate duration
   - `getDay()` - Get day of week (0-6)
   - `isWeekend()` - Check if Sat/Sun
   - `isSameDay()` - Holiday checking