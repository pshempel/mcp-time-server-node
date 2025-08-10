/**
 * MCP SDK Adapter - Public API
 *
 * This is what our tools import instead of the raw MCP SDK.
 * It provides a clean, testable interface that shields our code
 * from SDK bugs and changes.
 *
 * Tools should NEVER import directly from @modelcontextprotocol/sdk!
 */

// Import mapper for internal use
import { mapToMcpError } from './mapper';

// Export our error classes (what tools throw)
export {
  BaseError,
  ValidationError,
  TimezoneError,
  DateParsingError,
  BusinessHoursError,
  HolidayDataError,
  TimeCalculationError,
} from './errors';

// Re-export the mapper (for index.ts to use)
export { mapToMcpError };

// Re-export MCP types we need (with our fixes applied)
export { McpError, ErrorCode, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Export helper types for tools
export type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
};

export type ToolHandler<T = unknown> = (params: T) => ToolResult | Promise<ToolResult>;

/**
 * Helper function for tools to throw MCP-compatible errors
 *
 * @param error - The error to throw
 * @param toolName - Name of the tool throwing the error
 * @throws McpError - Always throws, properly formatted for MCP
 */
export function throwMcpError(error: unknown, toolName: string): never {
  // Import the mapper function from the same module
  const mcpError = mapToMcpError(error, toolName);
  throw mcpError;
}

/**
 * Wraps a tool handler with automatic error mapping
 *
 * @param toolName - Name of the tool for error context
 * @param handler - The tool handler function
 * @returns Wrapped handler that catches and maps errors
 */
export function wrapToolHandler<T = unknown>(
  toolName: string,
  handler: ToolHandler<T>
): ToolHandler<T> {
  return async (params: T): Promise<ToolResult> => {
    try {
      return await handler(params);
    } catch (error) {
      throwMcpError(error, toolName);
    }
  };
}
