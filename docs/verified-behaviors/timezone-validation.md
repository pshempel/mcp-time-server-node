# Timezone Validation with date-fns-tz (Updated 2025-07-18)

Using `getTimezoneOffset()` - Returns NaN for invalid timezones:
- `'UTC'`: valid (offset: 0ms)
- `'EST'`: valid (offset: -18000000ms)
- `'EST5EDT'`: valid (offset: -14400000ms)
- `'Invalid/Zone'`: invalid (offset: NaN)
- `'America/New_York'`: valid (offset: -14400000ms)
- `'Europe/London'`: valid (offset: 3600000ms)
- `'Asia/Tokyo'`: valid (offset: 32400000ms)
- `'NotATimezone'`: invalid (offset: NaN)
- `''`: valid (offset: 0ms - defaults to UTC)

**Key Finding**: `getTimezoneOffset()` returns NaN for invalid timezones, making it suitable for validation.