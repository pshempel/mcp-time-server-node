# Formatting with date-fns (Verified 2025-07-19)

**Key Findings**:

1. **Relative Formatting**:
   - `formatRelative()` - Returns strings like "tomorrow at 9:30 AM", "last Friday at 5:30 AM"
   - `formatDistance()` - Returns plain duration like "5 days", "2 hours"
   - `formatDistanceToNow()` - Always calculates from current Date.now()
   - `addSuffix: true` adds "ago" or "in" prefix

2. **Calendar-like Output**:
   - `formatRelative()` provides calendar-style formatting
   - Same day: "today at X"
   - Next/previous day: "tomorrow/yesterday at X"
   - Same week: "Friday at X"
   - Different week: shows date

3. **Custom Format Patterns**:
   - All standard date-fns tokens work
   - Invalid tokens are output literally (e.g., 'xyz' → 'xyz')
   - Empty string format causes error
   - Escaped text with single quotes: "'Today is' EEEE" → "Today is Monday"

4. **Common Format Patterns**:
   ```
   yyyy-MM-dd                 → 2025-01-20
   MM/dd/yyyy                 → 01/20/2025
   EEEE, MMMM do, yyyy       → Monday, January 20th, 2025
   h:mm a                    → 9:30 AM
   yyyy-MM-dd'T'HH:mm:ss.SSSXXX → 2025-01-20T09:30:45.123-05:00
   PPpp                      → Jan 20, 2025, 9:30:45 AM
   ```

5. **Timezone Formatting**:
   - Must use `formatInTimeZone()` for correct timezone display
   - `toZonedTime()` + `format()` shows system timezone (WRONG)
   - Pattern 'zzz' shows timezone abbreviation (e.g., "GMT-5")

6. **Error Handling**:
   - Empty format string throws TypeError
   - Invalid date returns "Invalid Date"
   - Unknown tokens output literally, no error