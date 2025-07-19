import { getTimezoneOffset } from 'date-fns-tz';

export interface TimeServerConfig {
  defaultTimezone: string;
}

let cachedConfig: TimeServerConfig | null = null;

/**
 * Validates if a timezone string is valid
 */
function isValidTimezone(timezone: string): boolean {
  try {
    const offset = getTimezoneOffset(timezone, new Date());
    return !isNaN(offset);
  } catch {
    return false;
  }
}

/**
 * Gets the system timezone safely
 */
function getSystemTimezone(): string | null {
  try {
    const resolvedOptions = Intl?.DateTimeFormat?.().resolvedOptions();
    return resolvedOptions?.timeZone ?? null;
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Get the server configuration including default timezone
 * Precedence: DEFAULT_TIMEZONE env > system timezone > UTC
 */
export function getConfig(): TimeServerConfig {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  let defaultTimezone = 'UTC'; // Final fallback

  // Check DEFAULT_TIMEZONE environment variable
  const envTimezone = process.env.DEFAULT_TIMEZONE;
  if (envTimezone && envTimezone !== '' && isValidTimezone(envTimezone)) {
    defaultTimezone = envTimezone;
  } else {
    // Try system timezone (which respects TZ env var)
    const systemTz = getSystemTimezone();
    if (systemTz && isValidTimezone(systemTz)) {
      defaultTimezone = systemTz;
    }
  }

  // Create and cache the config
  cachedConfig = Object.freeze({
    defaultTimezone,
  });

  return cachedConfig;
}

/**
 * Reset the configuration cache (mainly for testing)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}
