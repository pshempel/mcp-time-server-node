/**
 * Resolves timezone parameter according to project convention:
 * - undefined → system's local timezone (defaultTimezone)
 * - "" (empty string) → UTC
 * - Any other string → that specific IANA timezone
 *
 * This utility ensures consistent timezone resolution across all tools.
 * It does not validate the timezone string - that's handled elsewhere.
 */
export function resolveTimezone(timezone: string | undefined, defaultTimezone: string): string {
  if (timezone === '') return 'UTC';
  return timezone ?? defaultTimezone;
}
