# formatRelative with Timezones (Verified 2025-07-19)

**Critical Discovery**: `formatRelative()` cannot be used for timezone-aware relative formatting.

**Key Findings**:

1. **formatRelative Always Uses System Timezone**:
   - Regardless of the Date objects passed to it
   - No way to specify target timezone
   - Always formats times in the system's local timezone

2. **toDate() Behavior**:
   - `toDate(date, { timeZone: 'X' })` does NOT convert the date
   - Returns the same Date object (verified with ===)
   - The timezone option is misleading/useless for this use case

3. **The Broken Approach**:
   ```typescript
   // This DOES NOT WORK
   const zonedDate = toDate(date, { timeZone: timezone });
   const zonedNow = toDate(now, { timeZone: timezone });
   const timeDiff = zonedDate.getTime() - zonedNow.getTime();
   const adjustedDate = new Date(Date.now() + timeDiff);
   formatRelative(adjustedDate, new Date());
   // Always returns dates formatted in system timezone
   ```

4. **Correct Implementation Requires Manual Building**:
   ```typescript
   // Format time in target timezone
   const timeStr = formatInTimeZone(date, timezone, 'h:mm a');
   const dayOfWeek = formatInTimeZone(date, timezone, 'EEEE');
   
   // Calculate days difference
   const msPerDay = 24 * 60 * 60 * 1000;
   const daysDiff = Math.round((baseDate - date) / msPerDay);
   
   // Build relative string manually
   if (daysDiff === 0) return `today at ${timeStr}`;
   if (daysDiff === 1) return `yesterday at ${timeStr}`;
   if (daysDiff === -1) return `tomorrow at ${timeStr}`;
   // etc.
   ```

5. **Day Difference Calculation**:
   - Must use UTC dates for accurate day counting
   - Consider using start of day for both dates
   - Round the result to handle DST transitions

6. **Implementation Strategy**:
   - Cannot use `formatRelative()` at all
   - Must implement custom logic
   - Use `formatInTimeZone()` for time formatting
   - Build relative strings based on day differences