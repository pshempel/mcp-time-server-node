/**
 * TDD Tests for Error Handling Fix - Issue #1
 * These tests verify that errors are thrown correctly with our custom error types
 * Updated for new error architecture - tools throw our error classes, not MCP error objects
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
          to_timezone: 'UTC',
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
        expect(error.code).toMatch(/^[A-Z_]+_ERROR$/); // ErrorCode.InvalidParams
      }
    });

    it('should throw plain Error for invalid date format', async () => {
      try {
        await convertTimezone({
          time: 'not-a-date',
          from_timezone: 'UTC',
          to_timezone: 'America/New_York',
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
        expect(error.message).toBeDefined();
        expect(error.code).toMatch(/^[A-Z_]+_ERROR$/); // ErrorCode.InvalidParams
      }
    });
  });

  describe('formatTime error handling', () => {
    it('should throw plain Error for invalid date', async () => {
      try {
        await formatTime({
          time: 'invalid-date',
          format: 'custom',
          custom_format: 'yyyy-MM-dd',
        });
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
        expect(error.code).toMatch(/^[A-Z_]+_ERROR$/);
      }
    });

    it('should throw plain Error for missing custom format', async () => {
      try {
        await formatTime({
          time: '2025-01-01',
          format: 'custom',
          // missing custom_format
        });
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
        expect(error.code).toMatch(/^[A-Z_]+_ERROR$/);
      }
    });
  });

  describe('addTime error handling', () => {
    it('should throw plain Error for invalid unit', async () => {
      try {
        await addTime({
          time: '2025-01-01',
          amount: 1,
          unit: 'invalid' as any,
        });
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
        expect(error.code).toMatch(/^[A-Z_]+_ERROR$/);
      }
    });

    it('should throw plain Error for invalid date', async () => {
      try {
        await addTime({
          time: 'not-a-date',
          amount: 1,
          unit: 'days',
        });
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
        expect(error.code).toMatch(/^[A-Z_]+_ERROR$/);
      }
    });
  });

  describe('nextOccurrence error handling', () => {
    it('should throw plain Error for invalid pattern', async () => {
      try {
        await nextOccurrence({
          pattern: 'invalid' as any,
        });
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
        expect(error.code).toMatch(/^[A-Z_]+_ERROR$/);
      }
    });

    it('should throw plain Error for invalid start_from', async () => {
      try {
        await nextOccurrence({
          pattern: 'daily',
          start_from: 'not-a-date',
        });
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.error).toBeUndefined();
        expect(error.code).toMatch(/^[A-Z_]+_ERROR$/);
      }
    });
  });

  describe('Error code compatibility', () => {
    it('should set error codes correctly', async () => {
      try {
        await convertTimezone({
          time: '2025-01-01',
          from_timezone: 'Invalid/Zone',
          to_timezone: 'UTC',
        });
      } catch (error: any) {
        // Should have string error code
        expect(typeof error.code).toBe('string');
        // Should be our error codes
        expect(['TIMEZONE_ERROR', 'VALIDATION_ERROR', 'DATE_PARSING_ERROR']).toContain(error.code);
      }
    });
  });
});
