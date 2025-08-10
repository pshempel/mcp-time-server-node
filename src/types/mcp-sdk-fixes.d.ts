/**
 * Type definitions to fix MCP SDK export issues
 *
 * The SDK doesn't properly export ErrorCode and McpError in TypeScript,
 * even though they exist at runtime. This fixes that.
 *
 * Based on mcp-gemini-server approach but with correct numeric values.
 */

declare module '@modelcontextprotocol/sdk/types.js' {
  // ErrorCode enum - using actual numeric values from JSON-RPC spec
  export enum ErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
    ConnectionClosed = -32000,
    RequestTimeout = -32001,
  }

  // McpError class
  export class McpError extends Error {
    constructor(code: ErrorCode, message: string, data?: unknown);
    code: ErrorCode;
    data?: unknown;
  }

  // These are properly exported by SDK, but we include for completeness
  export interface CallToolResult {
    content: Array<
      | {
          type: 'text';
          text: string;
          [x: string]: unknown;
        }
      | {
          type: 'image';
          data: string;
          mimeType: string;
          [x: string]: unknown;
        }
    >;
    isError?: boolean;
    [x: string]: unknown;
  }

  // Add missing type exports that index.ts needs
  export interface CallToolRequest {
    params: {
      name: string;
      arguments?: unknown;
    };
  }

  export interface ListToolsRequest {
    // Empty or minimal interface for list tools request
  }

  // The schemas are exported at runtime, just need the types
  // These are Zod schemas but we'll type them as any for simplicity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const CallToolRequestSchema: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const ListToolsRequestSchema: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const CallToolResultSchema: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const ListToolsResultSchema: any;
}
