/**
 * Debug utilities for MCP server
 *
 * This now re-exports from the refactored debug system that supports
 * testability through lazy initialization and factory pattern.
 */

// Re-export everything from refactored debug
export {
  debug,
  logEnvironment,
  debugJson,
  setDebuggerFactory,
  resetDebuggerFactory,
  clearDebugCache,
} from './debug-refactored';
export type { DecisionContext } from './debug-refactored';
