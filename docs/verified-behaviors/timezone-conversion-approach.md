# Correct Timezone Conversion Approach (Verified 2025-07-18)

**Using toDate() for from_timezone handling**:
```typescript
// CORRECT: Treat "2025-07-18T12:00:00" as being in America/New_York
const utcDate = toDate('2025-07-18T12:00:00', { timeZone: 'America/New_York' });
// Result: 2025-07-18T16:00:00.000Z (UTC)

// Then format in target timezone
formatInTimeZone(utcDate, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
// Result: 2025-07-19T01:00:00.000+09:00
```

**Key Points**:
- `toDate(time, { timeZone: from })` correctly interprets the time as being in `from` timezone
- Works with DST transitions correctly
- Input with existing offset (e.g., `2025-07-18T12:00:00.000-05:00`) uses that offset, ignoring from_timezone