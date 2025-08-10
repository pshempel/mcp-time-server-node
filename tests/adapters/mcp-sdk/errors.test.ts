/**
 * Tests for MCP SDK Adapter error classes
 *
 * These tests verify our custom error hierarchy
 */

import {
  BaseError,
  TimeCalculationError,
  TimezoneError,
  BusinessHoursError,
  HolidayDataError,
  DateParsingError,
  ValidationError,
} from '../../../src/adapters/mcp-sdk/errors';

describe('MCP SDK Adapter - Error Classes', () => {
  describe('BaseError', () => {
    it('should create error with message, code, status and details', () => {
      const error = new BaseError('Test error', 'TEST_ERROR', 400, { field: 'test' });

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('BaseError');
    });

    it('should capture stack trace', () => {
      const error = new BaseError('Test error', 'TEST_ERROR', 500);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('BaseError');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const error = new ValidationError('Invalid input', { field: 'timezone' });

      expect(error).toBeInstanceOf(BaseError);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: 'timezone' });
      expect(error.name).toBe('ValidationError');
    });

    it('should work without details', () => {
      const error = new ValidationError('Invalid input');

      expect(error.details).toBeUndefined();
    });
  });

  describe('TimezoneError', () => {
    it('should create timezone error with correct code and status', () => {
      const error = new TimezoneError('Invalid timezone: XYZ', 'XYZ');

      expect(error).toBeInstanceOf(BaseError);
      expect(error.message).toBe('Invalid timezone: XYZ');
      expect(error.code).toBe('TIMEZONE_ERROR');
      expect(error.status).toBe(400);
      expect(error.invalidTimezone).toBe('XYZ');
    });

    it('should work without timezone parameter', () => {
      const error = new TimezoneError('Timezone not found');

      expect(error.invalidTimezone).toBeUndefined();
    });
  });

  describe('DateParsingError', () => {
    it('should create date parsing error with input details', () => {
      const error = new DateParsingError('Cannot parse date', {
        input: '2025-13-45',
        format: 'YYYY-MM-DD',
      });

      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe('DATE_PARSING_ERROR');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({
        input: '2025-13-45',
        format: 'YYYY-MM-DD',
      });
    });
  });

  describe('BusinessHoursError', () => {
    it('should create business hours error with 400 status', () => {
      const error = new BusinessHoursError('Invalid business hours config');

      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe('BUSINESS_HOURS_ERROR');
      expect(error.status).toBe(400);
    });
  });

  describe('HolidayDataError', () => {
    it('should create holiday data error with 503 status', () => {
      const error = new HolidayDataError('Failed to fetch holidays', {
        source: 'external-api',
        statusCode: 500,
      });

      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe('HOLIDAY_DATA_ERROR');
      expect(error.status).toBe(503); // Service unavailable
      expect(error.details).toEqual({
        source: 'external-api',
        statusCode: 500,
      });
    });
  });

  describe('TimeCalculationError', () => {
    it('should create time calculation error with 500 status', () => {
      const error = new TimeCalculationError('Arithmetic overflow');

      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe('TIME_CALCULATION_ERROR');
      expect(error.status).toBe(500);
    });

    it('should include calculation details', () => {
      const error = new TimeCalculationError('Overflow', {
        operation: 'add',
        value: Number.MAX_SAFE_INTEGER,
      });

      expect(error.details).toEqual({
        operation: 'add',
        value: Number.MAX_SAFE_INTEGER,
      });
    });
  });

  describe('Error inheritance', () => {
    it('should all extend BaseError', () => {
      const errors = [
        new ValidationError('test'),
        new TimezoneError('test'),
        new DateParsingError('test'),
        new BusinessHoursError('test'),
        new HolidayDataError('test'),
        new TimeCalculationError('test'),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(BaseError);
        expect(error).toBeInstanceOf(Error);
      });
    });
  });
});
