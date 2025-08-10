/**
 * Tests for MCP SDK Adapter error mapping
 *
 * These tests verify that our error types map correctly to MCP SDK error codes
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { mapToMcpError } from '../../../src/adapters/mcp-sdk/mapper';
import {
  TimeCalculationError,
  TimezoneError,
  BusinessHoursError,
  HolidayDataError,
  DateParsingError,
  ValidationError,
} from '../../../src/adapters/mcp-sdk/errors';

describe('MCP SDK Adapter - Error Mapping', () => {
  describe('mapToMcpError', () => {
    it('should map ValidationError to InvalidParams', () => {
      const error = new ValidationError('Missing required field', { field: 'timezone' });
      const mcpError = mapToMcpError(error, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InvalidParams);
      expect(mcpError.message).toContain('Missing required field');
      expect(mcpError.data).toEqual({ field: 'timezone' });
    });

    it('should map TimezoneError to InvalidParams', () => {
      const error = new TimezoneError('Invalid timezone: XYZ');
      const mcpError = mapToMcpError(error, 'convertTimezone');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InvalidParams);
      expect(mcpError.message).toContain('Invalid timezone');
    });

    it('should map DateParsingError to InvalidParams', () => {
      const error = new DateParsingError('Could not parse date: invalid');
      const mcpError = mapToMcpError(error, 'addTime');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InvalidParams);
      expect(mcpError.message).toContain('Could not parse date');
    });

    it('should map BusinessHoursError to InvalidRequest', () => {
      const error = new BusinessHoursError('Invalid business hours configuration');
      const mcpError = mapToMcpError(error, 'calculateBusinessHours');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InvalidRequest);
      expect(mcpError.message).toContain('business hours');
    });

    it('should map HolidayDataError to InvalidRequest', () => {
      const error = new HolidayDataError('Failed to fetch holiday data');
      const mcpError = mapToMcpError(error, 'getBusinessDays');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InvalidRequest);
      expect(mcpError.message).toContain('holiday data');
    });

    it('should map TimeCalculationError to InternalError', () => {
      const error = new TimeCalculationError('Overflow in time calculation');
      const mcpError = mapToMcpError(error, 'addTime');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InternalError);
      expect(mcpError.message).toContain('time calculation');
    });

    it('should return McpError unchanged if already McpError', () => {
      const originalError = new McpError(ErrorCode.InvalidParams, 'Test error');
      const mcpError = mapToMcpError(originalError, 'testTool');

      expect(mcpError).toBe(originalError);
    });

    it('should map generic Error to InternalError', () => {
      const error = new Error('Something went wrong');
      const mcpError = mapToMcpError(error, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InternalError);
      expect(mcpError.message).toContain('Something went wrong');
    });

    it('should map string error to InternalError', () => {
      const error = 'String error message';
      const mcpError = mapToMcpError(error, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InternalError);
      expect(mcpError.message).toContain('String error message');
    });

    it('should map unknown error to InternalError', () => {
      const error = { weird: 'object' };
      const mcpError = mapToMcpError(error, 'testTool');

      expect(mcpError).toBeInstanceOf(McpError);
      expect(mcpError.code).toBe(ErrorCode.InternalError);
      expect(mcpError.message).toContain('[testTool]');
    });

    it('should include tool name in error for generic errors', () => {
      const error = new Error('Generic failure');
      const mcpError = mapToMcpError(error, 'mySpecialTool');

      expect(mcpError.message).toContain('[mySpecialTool]');
      expect(mcpError.message).toContain('Generic failure');
    });

    it('should preserve error details when mapping', () => {
      const details = {
        input: '2025-13-45',
        format: 'YYYY-MM-DD',
        reason: 'Invalid month',
      };
      const error = new DateParsingError('Invalid date format', details);
      const mcpError = mapToMcpError(error, 'formatTime');

      expect(mcpError.data).toEqual(details);
    });
  });
});
