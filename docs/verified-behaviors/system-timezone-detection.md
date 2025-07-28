# System Timezone Detection (Verified 2025-07-19)

**Key Findings**:

1. **Intl.DateTimeFormat() Method**:
   - `Intl.DateTimeFormat().resolvedOptions().timeZone` returns system timezone
   - Returns valid IANA timezone string (e.g., "America/Indianapolis")
   - Always available in Node.js 14+ (our minimum version)
   - Performance: ~0.24ms per call (should cache)

2. **TZ Environment Variable**:
   - TZ affects `Intl.DateTimeFormat().resolvedOptions().timeZone` directly
   - `TZ=UTC` → system timezone becomes "UTC"
   - `TZ=""` → system timezone becomes "Etc/Unknown"
   - `TZ=Invalid/Zone` → system timezone becomes "undefined" (string)
   - Standard Unix way to set timezone, should be respected

3. **Environment Variable Behavior**:
   - `process.env.VAR` is `undefined` when not set
   - `process.env.VAR` is empty string `""` when set to empty
   - Can distinguish between unset and empty

4. **Timezone Validation**:
   - Empty string `""` is valid timezone (defaults to UTC in date-fns-tz)
   - String `"undefined"` is valid timezone (weird but true)
   - String `"null"` is valid timezone (also weird but true)
   - Use `getTimezoneOffset()` returns NaN for truly invalid timezones

5. **Recommended Precedence**:
   ```
   1. Parameter (if provided and not empty string)
   2. DEFAULT_TIMEZONE env var (if valid)
   3. System timezone via Intl.DateTimeFormat()
   4. UTC (final fallback)
   ```
   Note: TZ env var is automatically respected because it affects Intl.DateTimeFormat()

6. **Backward Compatibility**:
   - Empty string parameter `""` must continue to mean UTC
   - This is different from undefined parameter
   - Critical for maintaining API compatibility

7. **Performance Considerations**:
   - `Intl.DateTimeFormat().resolvedOptions().timeZone` is slow (~0.24ms)
   - Should be called once and cached
   - Config module should handle caching