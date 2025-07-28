# Timezone Conversion with date-fns-tz (Verified 2025-07-18)

**Key Findings**:
1. **Input Time Parsing**:
   - ISO with Z (e.g., `2025-07-18T12:00:00.000Z`) - treated as UTC
   - ISO with offset (e.g., `2025-07-18T12:00:00.000+05:30`) - respects the offset
   - ISO without timezone (e.g., `2025-07-18T12:00:00`) - treated as LOCAL time
   - Date only (e.g., `2025-07-18`) - treated as midnight in LOCAL time
   - Unix timestamp strings - NOT valid with parseISO

2. **formatInTimeZone Behavior**:
   - Correctly converts from any timezone to target timezone
   - When input has no timezone, it's interpreted as LOCAL time
   - Always shows the correct offset for the target timezone

3. **Offset Calculation**:
   - `getTimezoneOffset()` returns milliseconds (positive for east of UTC)
   - Difference between zones: `(toOffset - fromOffset) / 1000 / 60` = minutes
   - Example: NY to Tokyo = 780 minutes (13 hours) difference

4. **Format String Support**:
   - Supports all date-fns format strings
   - Default format: `yyyy-MM-dd'T'HH:mm:ss.SSSXXX`
   - Custom formats work as expected