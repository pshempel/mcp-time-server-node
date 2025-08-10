/**
 * TDD Tests for Error Handling Fix - Issue #1
 * These tests verify that errors are thrown correctly for MCP SDK
 * Session 112
 */

import { convertTimezone } from '../../src/tools/convertTimezone';
import { formatTime } from '../../src/tools/formatTime';
import { addTime } from '../../src/tools/addTime';
import { nextOccurrence } from '../../src/tools/nextOccurrence';

describe('Error Handling Fix - Issue #1', () => {
  describe('convertTimezone error handling', () => {
    it('should throw plain Error for invalid timezone, not wrapped', async () => {
      // Should NOT be wrapped in { error: ... }
      try {
        await convertTimezone({
          time: '2025-01-01',
          from_timezone: 'Invalid/Zone',
          to_timezone: 'UTC'
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // The error should be a plain Error, not an object with error property
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined(); // Should NOT have .error property
        expect(error.message).toContain('Invalid');
        // MCP SDK error code should be set directly on error
        expect(error.code).toBeDefined();
        expect(error.code).toBe(-32602); // ErrorCode.InvalidParams
      }
    });

    it('should throw plain Error for invalid date format', async () => {
      try {
        await convertTimezone({
          time: 'not-a-date',
          from_timezone: 'UTC',
          to_timezone: 'America/New_York'
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
        expect(error.message).toBeDefined();
        expect(error.code).toBe(-32602); // ErrorCode.InvalidParams
      }
    });
  });

  describe('formatTime error handling', () => {
    it('should throw plain Error for invalid date', async () => {
      await expect(
        formatTime({
          time: 'invalid-date',
          format: 'custom',
          custom_format: 'yyyy-MM-dd'
        })
      ).rejects.toThrow(Error);
      
      try {
        await formatTime({
          time: 'invalid-date',
          format: 'custom',
          custom_format: 'yyyy-MM-dd'
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
      }
    });

    it('should throw plain Error for missing custom format', async () => {
      await expect(
        formatTime({
          time: '2025-01-01',
          format: 'custom'
          // missing custom_format
        })
      ).rejects.toThrow(Error);
      
      try {
        await formatTime({
          time: '2025-01-01',
          format: 'custom'
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
      }
    });
  });

  describe('addTime error handling', () => {
    it('should throw plain Error for invalid unit', async () => {
      await expect(
        addTime({
          time: '2025-01-01',
          amount: 1,
          unit: 'invalid' as any
        })
      ).rejects.toThrow(Error);
      
      try {
        await addTime({
          time: '2025-01-01',
          amount: 1,
          unit: 'invalid' as any
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
      }
    });

    it('should throw plain Error for invalid date', async () => {
      await expect(
        addTime({
          time: 'not-a-date',
          amount: 1,
          unit: 'days'
        })
      ).rejects.toThrow(Error);
      
      try {
        await addTime({
          time: 'not-a-date',
          amount: 1,
          unit: 'days'
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
      }
    });
  });

  describe('nextOccurrence error handling', () => {
    it('should throw plain Error for invalid pattern', async () => {
      await expect(
        nextOccurrence({
          pattern: 'invalid' as any
        })
      ).rejects.toThrow(Error);
      
      try {
        await nextOccurrence({
          pattern: 'invalid' as any
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
      }
    });

    it('should throw plain Error for invalid start_from', async () => {
      await expect(
        nextOccurrence({
          pattern: 'daily',
          start_from: 'not-a-date'
        })
      ).rejects.toThrow(Error);
      
      try {
        await nextOccurrence({
          pattern: 'daily',
          start_from: 'not-a-date'
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
      }
    });
  });

  describe('Error code compatibility', () => {
    it('should set MCP SDK error codes correctly', async () => {
      try {
        await convertTimezone({
          time: '2025-01-01',
          from_timezone: 'Invalid/Zone',
          to_timezone: 'UTC'
        });
      } catch (error: any) {
        // Should have numeric MCP error code
        expect(typeof error.code).toBe('number');
        // -32602 is InvalidParams, -32603 is InternalError
        expect([-32602, -32603]).toContain(error.code);
      }
    });
  });
});