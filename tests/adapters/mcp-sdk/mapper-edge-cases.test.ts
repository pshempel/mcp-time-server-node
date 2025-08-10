/**
 * Edge case tests for MCP SDK Adapter error mapping
 *
 * These tests verify we handle unusual error conditions safely
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { mapToMcpError } from '../../../src/adapters/mcp-sdk/mapper';

describe('MCP SDK Adapter - Edge Cases', () => {
  describe('mapToMcpError edge cases', () => {
    it('should handle null error', () => {
      const mcpError = mapToMcpError(null, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InternalError);
      expect(mcpError.message).toContain('[testTool]');
    });

    it('should handle undefined error', () => {
      const mcpError = mapToMcpError(undefined, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InternalError);
      expect(mcpError.message).toContain('[testTool]');
    });

    it('should handle circular reference in error object', () => {
      const circularError: any = { message: 'circular' };
      circularError.self = circularError; // Create circular reference

      const mcpError = mapToMcpError(circularError, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InternalError);
      // Should not crash when trying to stringify
    });

    it('should handle error with throwing getter', () => {
      const error = {
        get message() {
          throw new Error('Getter throws!');
        },
      };

      const mcpError = mapToMcpError(error, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InternalError);
      // Should not crash
    });

    it('should handle nested errors with cause', () => {
      const rootCause = new Error('Root cause');
      const middleError = new Error('Middle error');
      middleError.cause = rootCause;
      const topError = new Error('Top error');
      topError.cause = middleError;

      const mcpError = mapToMcpError(topError, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.message).toContain('Top error');
      // Should include cause chain information
      expect(mcpError.data).toHaveProperty('cause');
    });

    it('should truncate extremely large error details', () => {
      const hugeDetails = {
        data: 'x'.repeat(100000), // 100KB of data
        nested: {
          more: 'y'.repeat(100000),
        },
      };

      const error = new Error('Large error');
      (error as any).details = hugeDetails;

      const mcpError = mapToMcpError(error, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      // Details should be truncated or omitted
      if (mcpError.data) {
        const serialized = JSON.stringify(mcpError.data);
        expect(serialized.length).toBeLessThan(10000); // Max 10KB
      }
    });

    it('should handle symbol properties in error', () => {
      const error = new Error('Symbol error');
      const sym = Symbol('test');
      (error as any)[sym] = 'hidden value';

      const mcpError = mapToMcpError(error, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.message).toContain('Symbol error');
      // Should not crash on symbols
    });

    it('should handle frozen error objects', () => {
      const error = new Error('Frozen error');
      Object.freeze(error);

      const mcpError = mapToMcpError(error, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.message).toContain('Frozen error');
    });

    it('should handle Promise rejection values', async () => {
      // Create a rejected promise without triggering unhandled rejection
      const promiseRejection = Promise.reject('Rejected!');
      promiseRejection.catch(() => {}); // Handle the rejection

      const mcpError = mapToMcpError(promiseRejection, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      // Should handle Promise as an object
    });

    it('should handle error with numeric code property', () => {
      const error = new Error('Numeric code');
      (error as any).code = 404;

      const mcpError = mapToMcpError(error, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.data).toHaveProperty('originalCode', 404);
    });
  });
});
