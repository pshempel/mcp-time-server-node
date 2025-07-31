/**
 * Debug utilities for MCP server
 *
 * Uses the 'debug' module for conditional logging to stderr.
 * Enable with DEBUG environment variable:
 *
 * DEBUG=mcp:* node dist/index.js          # All debug output
 * DEBUG=mcp:rate-limit node dist/index.js # Just rate limiting
 * DEBUG=mcp:server,mcp:tools node dist/index.js # Multiple namespaces
 */

import createDebug from 'debug';

// Create namespaced debuggers
export const debug = {
  server: createDebug('mcp:server'),
  rateLimit: createDebug('mcp:rate-limit'),
  tools: createDebug('mcp:tools'),
  protocol: createDebug('mcp:protocol'),
  cache: createDebug('mcp:cache'),
  init: createDebug('mcp:init'),
  holidays: createDebug('mcp:holidays'),
};

// Helper to log environment variables at startup
export function logEnvironment(): void {
  if (debug.init.enabled) {
    debug.init('=== MCP Server Environment ===');
    debug.init('NODE_ENV: %s', process.env.NODE_ENV ?? 'production');
    debug.init('RATE_LIMIT: %s', process.env.RATE_LIMIT ?? '100 (default)');
    debug.init('RATE_LIMIT_WINDOW: %s', process.env.RATE_LIMIT_WINDOW ?? '60000 (default)');
    debug.init('DEBUG: %s', process.env.DEBUG ?? '(not set)');
    debug.init('==============================');
  }
}

// Helper to format JSON for debug output
export function debugJson(namespace: keyof typeof debug, label: string, obj: unknown): void {
  // Use explicit namespace mapping to avoid object injection
  const loggers = {
    server: debug.server,
    rateLimit: debug.rateLimit,
    tools: debug.tools,
    protocol: debug.protocol,
    cache: debug.cache,
    init: debug.init,
    holidays: debug.holidays,
  };

  // eslint-disable-next-line security/detect-object-injection
  const logger = loggers[namespace];
  if (logger && logger.enabled) {
    logger('%s: %O', label, obj);
  }
}
