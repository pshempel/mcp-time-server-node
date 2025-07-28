# Timezone Formatting with date-fns-tz (Verified 2025-07-18)

**CRITICAL**: Must use `formatInTimeZone` for proper timezone formatting:

```typescript
// WRONG - always shows system timezone offset
const zonedTime = toZonedTime(now, 'Asia/Tokyo');
format(zonedTime, 'XXX'); // Shows YOUR system offset, not Tokyo's!

// CORRECT - shows target timezone offset
formatInTimeZone(now, 'Asia/Tokyo', 'XXX'); // '+09:00'
formatInTimeZone(now, 'UTC', 'XXX'); // 'Z'
```

**Key Findings**:
- `toZonedTime` + `format` = WRONG (shows system timezone)
- `formatInTimeZone` = CORRECT (shows target timezone)
- UTC displays as 'Z' with 'XXX' format
- Empty string timezone works without error (treats as UTC)