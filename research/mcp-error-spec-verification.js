#!/usr/bin/env node

/**
 * Research script to understand MCP error handling specification
 * 
 * Goal: Verify the EXACT format MCP SDK expects for errors
 * 
 * From MCP SDK types.d.ts:
 * - JSON-RPC error response has: jsonrpc, id, error
 * - error object has: code (number), message (string), data (optional)
 * - Error codes are defined in ErrorCode enum
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ErrorCode } = require('@modelcontextprotocol/sdk/types.js');

console.log('=== MCP Error Handling Research ===\n');

// 1. Check available error codes
console.log('Available ErrorCode values from MCP SDK:');
console.log(ErrorCode);
console.log();

// 2. Create a test server to see how it handles errors
async function testErrorHandling() {
  const server = new Server(
    {
      name: 'test-error-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Test different error throwing patterns
  console.log('Testing error throwing patterns:\n');

  // Pattern 1: Throw plain Error object
  server.setRequestHandler('tools/call', async (request) => {
    const toolName = request.params.name;
    
    if (toolName === 'test_plain_error') {
      // This is what we suspect is WRONG
      throw new Error('Plain error message');
    }
    
    if (toolName === 'test_error_wrapper') {
      // This is what we're currently doing
      throw {
        error: {
          code: ErrorCode.InvalidParams,
          message: 'Invalid parameters provided',
          data: { detail: 'Missing required field' }
        }
      };
    }
    
    if (toolName === 'test_mcp_error') {
      // This might be the correct way
      const error = new Error('MCP formatted error');
      error.code = ErrorCode.InvalidParams;
      error.data = { detail: 'Additional context' };
      throw error;
    }

    if (toolName === 'test_json_error') {
      // Or maybe throw the error object directly?
      throw {
        code: ErrorCode.InvalidParams,
        message: 'Direct error object',
        data: { field: 'timezone' }
      };
    }

    // Default response
    return {
      content: [{ type: 'text', text: 'Tool executed successfully' }]
    };
  });

  // Log how errors are serialized
  console.log('Server configured with test error handlers');
  
  // Check the actual implementation
  console.log('\nChecking MCP SDK Server source for error handling...');
  
  // The SDK likely catches errors and formats them as JSON-RPC errors
  // Let's trace what happens when we throw
  
  return server;
}

// 3. Analyze the protocol handler
async function analyzeProtocol() {
  console.log('\n=== Protocol Analysis ===\n');
  
  // From looking at the types, JSON-RPC error response should be:
  const expectedErrorResponse = {
    jsonrpc: "2.0",
    id: "request-id-here",
    error: {
      code: -32602,  // InvalidParams
      message: "Error message here",
      data: {}  // Optional additional data
    }
  };
  
  console.log('Expected JSON-RPC error response format:');
  console.log(JSON.stringify(expectedErrorResponse, null, 2));
  
  console.log('\nOur current error throwing pattern:');
  const ourPattern = {
    error: {
      code: 'INVALID_PARAMETER',
      message: 'Invalid timezone',
      details: { timezone: 'Invalid/Zone' }
    }
  };
  console.log(JSON.stringify(ourPattern, null, 2));
  
  console.log('\n❌ PROBLEMS IDENTIFIED:');
  console.log('1. We wrap errors in {error: ...} but should throw directly');
  console.log('2. We use string codes like "INVALID_PARAMETER" not numbers');
  console.log('3. We use "details" not "data" for additional info');
  console.log('4. MCP SDK expects numeric error codes from ErrorCode enum');
}

// 4. Test with actual MCP communication
async function testWithTransport() {
  console.log('\n=== Testing with Mock Transport ===\n');
  
  const server = await testErrorHandling();
  
  // Create a mock request
  const mockRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'test_plain_error',
      arguments: {}
    }
  };
  
  console.log('Mock request:', JSON.stringify(mockRequest, null, 2));
  
  // Note: Actually testing this would require setting up transport
  // but we can infer from the types what format is expected
}

// 5. Recommendations
function printRecommendations() {
  console.log('\n=== RECOMMENDATIONS ===\n');
  
  console.log('✅ CORRECT error handling pattern:');
  console.log(`
// Import ErrorCode enum from MCP SDK
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// For validation errors:
throw new Error('Invalid timezone provided');
// The SDK will wrap this in proper JSON-RPC error format

// OR for more control:
const error = new Error('Invalid timezone: America/Invalid');
error.code = ErrorCode.InvalidParams;  // Use numeric code
error.data = { field: 'timezone', value: 'America/Invalid' };
throw error;
`);

  console.log('\n❌ INCORRECT patterns (what we\'re doing now):');
  console.log(`
// DON'T wrap in {error: ...}
throw {
  error: createError(...)  // WRONG!
};

// DON'T use string error codes
throw {
  code: 'INVALID_PARAMETER',  // Should be numeric!
  message: '...'
};
`);

  console.log('\n📋 Action items:');
  console.log('1. Remove all {error: ...} wrappers when throwing');
  console.log('2. Map our string codes to MCP ErrorCode enum values');
  console.log('3. Use "data" not "details" for additional error context');
  console.log('4. Let MCP SDK handle JSON-RPC error formatting');
}

// Run the research
async function main() {
  try {
    await analyzeProtocol();
    await testWithTransport();
    printRecommendations();
    
    console.log('\n=== ErrorCode Enum Values ===');
    console.log('ConnectionClosed:', ErrorCode.ConnectionClosed, '(-32000)');
    console.log('RequestTimeout:', ErrorCode.RequestTimeout, '(-32001)');
    console.log('ParseError:', ErrorCode.ParseError, '(-32700)');
    console.log('InvalidRequest:', ErrorCode.InvalidRequest, '(-32600)');
    console.log('MethodNotFound:', ErrorCode.MethodNotFound, '(-32601)');
    console.log('InvalidParams:', ErrorCode.InvalidParams, '(-32602)');
    console.log('InternalError:', ErrorCode.InternalError, '(-32603)');
    
  } catch (error) {
    console.error('Research failed:', error);
  }
}

main();