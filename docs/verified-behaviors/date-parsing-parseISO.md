# Date Parsing with parseISO()

**Actual Test Results:**
- `'2024-01-01'`: true (ISO date)
- `'2024-01-01T12:00:00Z'`: true (ISO with time and Z)
- `'2024-01-01T12:00:00+05:30'`: true (ISO with timezone offset)
- `'2024-01-01T12:00:00.123Z'`: true (ISO with milliseconds)
- `'Mon, 01 Jan 2024 12:00:00 GMT'`: false (RFC2822 not supported by parseISO)
- `'1704110400'`: false (Unix timestamp string not supported)
- `'not-a-date'`: false
- `'2024-13-01'`: false (invalid month)
- `'2024-01-32'`: false (invalid day)
- `''`: false (empty string)