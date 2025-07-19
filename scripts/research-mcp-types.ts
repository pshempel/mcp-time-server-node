#!/usr/bin/env -S npx tsx
/**
 * Research MCP SDK types for proper error handling
 */

import type {
  JSONRPCError,
  JSONRPCRequest,
  JSONRPCResponse,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

console.log('=== MCP SDK Type Research ===\n');

// Explore error codes
console.log('1. Standard JSON-RPC Error Codes:');
console.log('   -32700: Parse error');
console.log('   -32600: Invalid Request');
console.log('   -32601: Method not found');
console.log('   -32602: Invalid params');
console.log('   -32603: Internal error');
console.log('   -32000 to -32099: Server error (reserved for implementation-defined errors)\n');

// Check how MCP handles errors
console.log('2. MCP Error Handling:');
console.log('   - Errors are returned as JSONRPCError objects');
console.log('   - The CallToolResult can include an error property');
console.log('   - Server can return error responses directly\n');

// Type definitions
console.log('3. Type Definitions for Reference:');
console.log(`
interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

interface ErrorResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  error: JSONRPCError;
}

// For tool execution errors
interface CallToolResult {
  content?: Array<{ type: string; text?: string }>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
`);

console.log('\n4. Rate Limiting Error Response Options:');
console.log('   Option A: Return JSON-RPC error (blocks at protocol level)');
console.log('   Option B: Return CallToolResult with error (tool-level error)');
console.log('   Option C: Throw error and let handler convert it\n');

console.log('5. Best Practice Recommendation:');
console.log('   - Use JSON-RPC error (-32000 range) for rate limiting');
console.log('   - This prevents tool execution entirely');
console.log('   - Include helpful data in error.data field');
console.log('   - Client gets immediate feedback without tool processing\n');

console.log('=== Research Complete ===');
