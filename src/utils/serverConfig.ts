import { EventEmitter } from 'events';

/**
 * Get the max listeners value from environment or use default
 */
function getMaxListenersValue(): number {
  const DEFAULT_MAX_LISTENERS = 20;
  const MIN_MAX_LISTENERS = 10;

  const envValue = process.env.MAX_LISTENERS;

  if (!envValue) {
    return DEFAULT_MAX_LISTENERS;
  }

  const parsed = parseInt(envValue, 10);

  // Check for invalid values
  if (isNaN(parsed) || parsed <= 0) {
    return DEFAULT_MAX_LISTENERS;
  }

  // Enforce minimum value
  if (parsed < MIN_MAX_LISTENERS) {
    return MIN_MAX_LISTENERS;
  }

  return parsed;
}

/**
 * Configure server-wide settings to prevent warnings and optimize performance
 */
export function configureServer(): void {
  // Increase max listeners to handle concurrent MCP requests
  // Default is 10, but MCP servers can have many concurrent AbortSignal listeners
  const maxListeners = getMaxListenersValue();

  EventEmitter.defaultMaxListeners = maxListeners;

  // Also set for the global process
  process.setMaxListeners(maxListeners);
}

/**
 * Get current max listeners configuration
 */
export function getMaxListenersConfig(): {
  defaultMaxListeners: number;
  processMaxListeners: number;
} {
  return {
    defaultMaxListeners: EventEmitter.defaultMaxListeners,
    processMaxListeners: process.getMaxListeners(),
  };
}
