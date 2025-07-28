# Native JavaScript Timezone Validation Options (Tested 2025-07-18)

1. **Intl.supportedValuesOf('timeZone')** 
   - Returns array of 428 valid IANA timezones
   - Requires Node 14.18+
   - Always accurate to runtime environment

2. **Intl.DateTimeFormat with try/catch**
   - Throws exception for invalid timezones
   - Works on older Node versions
   - Good for validation

3. **getTimezoneOffset from date-fns-tz**
   - Returns NaN for invalid timezones
   - Already in our dependency stack
   - Fast and reliable