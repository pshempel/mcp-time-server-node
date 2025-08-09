/**
 * Debug Utilities for MCP Server
 *
 * Simple, direct instantiation approach.
 * Test capture doesn't work with Jest anyway due to module loading order,
 * so we don't need the complexity of lazy loading.
 */

import createDebugger from 'debug';

export interface DecisionContext {
  [key: string]: unknown;
}

class Debug {
  // Direct instantiation - simple and works perfectly in production
  readonly business = createDebugger('mcp:business');
  readonly timezone = createDebugger('mcp:timezone');
  readonly parse = createDebugger('mcp:parse');
  readonly error = createDebugger('mcp:error');
  readonly trace = createDebugger('mcp:trace');
  readonly cache = createDebugger('mcp:cache');
  readonly holidays = createDebugger('mcp:holidays');
  readonly timing = createDebugger('mcp:timing');
  readonly recurrence = createDebugger('mcp:recurrence');
  readonly validation = createDebugger('mcp:validation');

  // Server/system namespaces
  readonly server = createDebugger('mcp:server');
  readonly init = createDebugger('mcp:init');
  readonly utils = createDebugger('mcp:utils');
  readonly protocol = createDebugger('mcp:protocol');
  readonly rateLimit = createDebugger('mcp:rate-limit');

  // Future namespaces (not yet used)
  readonly parsing = createDebugger('mcp:parsing');
  readonly calculation = createDebugger('mcp:calculation');
  readonly format = createDebugger('mcp:format');
  readonly natural = createDebugger('mcp:natural');
  readonly integration = createDebugger('mcp:integration');
  readonly decision = createDebugger('mcp:decision');
}

// Export singleton instance
export const debug = new Debug();

/**
 * Log environment configuration at startup
 * Call this from your server initialization
 */
export function logEnvironment(): void {
  if (debug.init.enabled) {
    debug.init('=== MCP Server Environment ===');
    debug.init('NODE_ENV: %s', process.env.NODE_ENV ?? 'development');
    debug.init('RATE_LIMIT: %s', process.env.RATE_LIMIT ?? '100 (default)');
    debug.init('RATE_LIMIT_WINDOW: %s', process.env.RATE_LIMIT_WINDOW ?? '60000 (default)');
    debug.init('DEBUG: %s', process.env.DEBUG ?? '(not set)');
    debug.init('==============================');
  }
}

/**
 * Helper to log objects with a specific namespace
 * Useful for structured logging of complex data
 */
export function debugJson(namespace: keyof Debug, label: string, obj: unknown): void {
  // eslint-disable-next-line security/detect-object-injection
  const logger = debug[namespace];
  if (logger.enabled) {
    logger('%s: %O', label, obj);
  }
}
