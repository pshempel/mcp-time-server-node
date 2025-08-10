/**
 * Refactored Debug Utilities for MCP Server
 *
 * This implementation uses lazy initialization with a factory pattern
 * to make debug output testable while maintaining the same API.
 *
 * Key changes from original:
 * 1. Debug instances created on-demand via getters (lazy loading)
 * 2. Factory function can be overridden by tests
 * 3. Cache can be cleared for test isolation
 * 4. Same exact API for production code
 */

import createDebugger from 'debug';

export interface DecisionContext {
  [key: string]: unknown;
}

// Factory function that tests can override
let debuggerFactory: typeof createDebugger = createDebugger;

// Cache management for test isolation
let instanceCache: Map<string, ReturnType<typeof createDebugger>> | null = null;

/**
 * Override the debugger factory (for testing)
 * Must be called BEFORE any debug instances are accessed
 */
export function setDebuggerFactory(factory: typeof createDebugger): void {
  debuggerFactory = factory;
  clearDebugCache(); // Clear cache when factory changes
}

/**
 * Reset to default factory
 */
export function resetDebuggerFactory(): void {
  debuggerFactory = createDebugger;
  clearDebugCache();
}

/**
 * Clear the debug instance cache (for test isolation)
 */
export function clearDebugCache(): void {
  instanceCache = null;
}

class DebugEnhanced {
  // Lazy-loaded cache for debug instances
  private get debuggerCache(): Map<string, ReturnType<typeof createDebugger>> {
    instanceCache ??= new Map();
    return instanceCache;
  }

  // Use getters for lazy initialization of all namespaces
  // This ensures instances are created AFTER test setup

  get business(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:business');
  }

  get timezone(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:timezone');
  }

  get parse(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:parse');
  }

  get error(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:error');
  }

  get trace(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:trace');
  }

  get cache(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:cache');
  }

  get holidays(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:holidays');
  }

  get timing(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:timing');
  }

  get recurrence(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:recurrence');
  }

  // Legacy namespaces for backward compatibility
  get server(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:server');
  }

  get rateLimit(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:rate-limit');
  }

  get protocol(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:protocol');
  }

  get init(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:init');
  }

  get utils(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:utils');
  }

  get parsing(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:parsing');
  }

  get validation(): ReturnType<typeof createDebugger> {
    return this.getDebugger('mcp:validation');
  }

  /**
   * Extract function name from a stack line
   */
  private extractFunctionName(line: string): string | null {
    const match = line.match(/at (\w+)|at Object\.(\w+)|at async (\w+)/);
    if (match) {
      const funcName = match[1] || match[2] || match[3] || 'anonymous';
      return funcName.replace(/Wrapper$/, '').replace(/Impl$/, '');
    }
    return null;
  }

  /**
   * Check if a stack line is from debug internals
   */
  private isDebugInternal(line: string): boolean {
    return (
      line.includes('debugEnhanced') ||
      line.includes('DebugEnhanced') ||
      line.includes('debug.ts') ||
      line.includes('debug-refactored.ts') ||
      line.includes('withCache') ||
      line.includes('withDebug')
    );
  }

  /**
   * Get calling context from stack for auto-namespacing
   */
  private getCallerContext(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    // Walk up stack to find first non-debug function
    for (let i = 3; i < lines.length && i < 10; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const line = lines[i];
      if (!line) continue;

      // Skip internal debug functions
      if (this.isDebugInternal(line)) {
        continue;
      }

      // Extract function name
      const funcName = this.extractFunctionName(line);
      if (funcName) {
        return funcName;
      }
    }

    return 'anonymous';
  }

  /**
   * Get or create a debugger instance for a namespace
   * This is THE key change - using the factory that tests can override
   */
  private getDebugger(namespace: string): ReturnType<typeof createDebugger> {
    let debugInstance = this.debuggerCache.get(namespace);
    if (!debugInstance) {
      // Use the factory function (which tests can override)
      debugInstance = debuggerFactory(namespace);
      this.debuggerCache.set(namespace, debugInstance);
    }
    return debugInstance;
  }

  /**
   * Auto-namespaced log based on calling function
   */
  log(message: string, ...args: unknown[]): void {
    const context = this.getCallerContext();
    const namespace = `mcp:auto:${context}`;
    const debugInstance = this.getDebugger(namespace);
    debugInstance(message, ...args);
  }

  /**
   * Structured decision logging for complex branching logic
   */
  decision(description: string, context: DecisionContext): void {
    const caller = this.getCallerContext();
    const namespace = `mcp:decision:${caller}`;
    const debugInstance = this.getDebugger(namespace);

    // Format for readability
    if (Object.keys(context).length <= 3) {
      // Inline for simple decisions
      const formatted = Object.entries(context)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ');
      debugInstance('📊 %s → %s', description, formatted);
    } else {
      // Multi-line for complex decisions
      debugInstance('📊 %s:', description);
      Object.entries(context).forEach(([key, value]) => {
        debugInstance('   %s: %O', key, value);
      });
    }
  }

  /**
   * Error context logging
   */
  errorContext(error: unknown, context: DecisionContext): void {
    const caller = this.getCallerContext();
    const namespace = `mcp:error:${caller}`;
    const debugInstance = this.getDebugger(namespace);
    debugInstance('❌ Error in %s: %O', caller, error);
    debugInstance('   Context: %O', context);
  }

  /**
   * Performance timing helper
   */
  time(label: string): () => void {
    const start = Date.now();
    const caller = this.getCallerContext();
    const namespace = `mcp:perf:${caller}`;
    const debugInstance = this.getDebugger(namespace);

    return () => {
      const duration = Date.now() - start;
      debugInstance('⏱️  %s took %dms', label, duration);
    };
  }
}

// Export singleton instance
export const debug = new DebugEnhanced();

// Legacy helper functions for backward compatibility
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

export function debugJson(namespace: string, label: string, obj: unknown): void {
  // Map of namespace strings to debugger instances
  const namespaceMap: Record<string, ReturnType<typeof createDebugger> | undefined> = {
    business: debug.business,
    timezone: debug.timezone,
    parse: debug.parse,
    error: debug.error,
    trace: debug.trace,
    cache: debug.cache,
    holidays: debug.holidays,
    timing: debug.timing,
    recurrence: debug.recurrence,
    server: debug.server,
    rateLimit: debug.rateLimit,
    protocol: debug.protocol,
    init: debug.init,
    utils: debug.utils,
    parsing: debug.parsing,
    validation: debug.validation,
  };

  // eslint-disable-next-line security/detect-object-injection
  const logger = namespaceMap[namespace];
  if (logger?.enabled) {
    logger('%s: %O', label, obj);
  }
}
