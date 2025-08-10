/**
 * Custom error classes for MCP Time Server
 *
 * These provide meaningful error differentiation that the MCP SDK lacks.
 * Each error type maps to appropriate MCP ErrorCode in mapper.ts
 */

/**
 * Base error class for all time server errors
 */
export class BaseError extends Error {
  public code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    // Capture stack trace (excluding constructor)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for validation failures (e.g., invalid input)
 * Maps to MCP ErrorCode.InvalidParams
 */
export class ValidationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Error for invalid timezone specifications
 * Maps to MCP ErrorCode.InvalidParams
 */
export class TimezoneError extends BaseError {
  public readonly invalidTimezone?: string;

  constructor(message: string, invalidTimezone?: string) {
    super(
      message,
      'TIMEZONE_ERROR',
      400,
      invalidTimezone ? { timezone: invalidTimezone } : undefined
    );
    this.invalidTimezone = invalidTimezone;
  }
}

/**
 * Error for date/time parsing failures
 * Maps to MCP ErrorCode.InvalidParams
 */
export class DateParsingError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATE_PARSING_ERROR', 400, details);
  }
}

/**
 * Error for invalid business hours configuration
 * Maps to MCP ErrorCode.InvalidRequest
 */
export class BusinessHoursError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, 'BUSINESS_HOURS_ERROR', 400, details);
  }
}

/**
 * Error when holiday data cannot be fetched or processed
 * Maps to MCP ErrorCode.InvalidRequest (external dependency issue)
 */
export class HolidayDataError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, 'HOLIDAY_DATA_ERROR', 503, details); // Service unavailable
  }
}

/**
 * Error for time calculation failures (overflow, underflow, etc.)
 * Maps to MCP ErrorCode.InternalError
 */
export class TimeCalculationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, 'TIME_CALCULATION_ERROR', 500, details);
  }
}
