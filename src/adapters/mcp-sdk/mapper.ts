/**
 * Maps our custom error types to MCP SDK errors
 *
 * This is the adapter layer that shields our code from SDK limitations
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

import {
  BaseError,
  ValidationError,
  TimezoneError,
  DateParsingError,
  BusinessHoursError,
  HolidayDataError,
  TimeCalculationError,
} from './errors';

/**
 * Maximum size for error details to prevent protocol issues
 */
const MAX_DETAILS_SIZE = 10000; // 10KB

/**
 * Error type to MCP ErrorCode mapping configuration
 */
const ERROR_TYPE_MAPPINGS = [
  // Validation-related errors → InvalidParams
  { type: ValidationError, code: ErrorCode.InvalidParams, prefix: 'Validation error' },
  { type: TimezoneError, code: ErrorCode.InvalidParams, prefix: 'Timezone error' },
  { type: DateParsingError, code: ErrorCode.InvalidParams, prefix: 'Date parsing error' },

  // Configuration/external errors → InvalidRequest
  { type: BusinessHoursError, code: ErrorCode.InvalidRequest, prefix: 'Business hours error' },
  { type: HolidayDataError, code: ErrorCode.InvalidRequest, prefix: 'Holiday data error' },

  // Calculation/internal errors → InternalError
  { type: TimeCalculationError, code: ErrorCode.InternalError, prefix: 'Time calculation error' },
];

/**
 * Safely extracts error message from unknown error type
 */
// eslint-disable-next-line complexity
function extractErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (error == null) {
    return 'An unknown error occurred';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error instances (includes our BaseError)
  if (error instanceof Error) {
    try {
      return error.message;
    } catch {
      // In case .message getter throws
      return 'Error message unavailable';
    }
  }

  // Handle objects
  if (typeof error === 'object') {
    try {
      // Check for message property first
      const errorObj = error as Record<string, unknown>;
      if ('message' in errorObj && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
      // Try to stringify (with circular reference protection)
      return JSON.stringify(error, getCircularReplacer());
    } catch {
      return 'Complex error object';
    }
  }

  // Fallback for other types - handle objects specially
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return '[Circular object]';
    }
  }
  // Only primitives left (string, number, boolean, undefined, null, symbol, bigint)
  // TypeScript doesn't know we've already handled all objects, so we assert
  return String(error as string | number | boolean | undefined | null | symbol | bigint);
}

/**
 * Collects error details from various sources
 */
function collectErrorDetails(error: object): Record<string, unknown> {
  const details: Record<string, unknown> = {};

  // Extract details from BaseError
  if (error instanceof BaseError && error.details) {
    Object.assign(details, error.details);
  }

  // Extract error cause chain
  if (error instanceof Error && error.cause) {
    details.cause = extractCauseChain(error.cause);
  }

  // Extract any numeric code (for compatibility)
  const errorWithCode = error as { code?: unknown };
  if ('code' in errorWithCode && typeof errorWithCode.code === 'number') {
    details.originalCode = errorWithCode.code;
  }

  return details;
}

/**
 * Truncates details if they exceed size limit
 */
function truncateDetailsIfNeeded(details: Record<string, unknown>): unknown {
  if (Object.keys(details).length === 0) {
    return undefined;
  }

  const serialized = JSON.stringify(details, getCircularReplacer());
  if (serialized && serialized.length > MAX_DETAILS_SIZE) {
    return {
      truncated: true,
      message: 'Details truncated due to size',
      partial: JSON.parse(serialized.substring(0, MAX_DETAILS_SIZE - 100)) as unknown,
    };
  }

  return details;
}

/**
 * Safely extracts error details including nested causes
 */
function extractErrorDetails(error: unknown): unknown {
  if (error == null || typeof error !== 'object') {
    return undefined;
  }

  const details = collectErrorDetails(error);
  return truncateDetailsIfNeeded(details);
}

/**
 * Extracts cause chain from nested errors
 */
function extractCauseChain(cause: unknown, depth = 0): unknown {
  if (depth > 5) {
    // Prevent infinite recursion
    return 'Cause chain too deep';
  }

  if (cause instanceof Error) {
    const causeInfo: Record<string, unknown> = {
      message: cause.message,
      type: cause.constructor.name,
    };

    if (cause.cause) {
      causeInfo.cause = extractCauseChain(cause.cause, depth + 1);
    }

    return causeInfo;
  }

  return extractErrorMessage(cause);
}

/**
 * JSON replacer that handles circular references
 */
function getCircularReplacer(): (key: string, value: unknown) => unknown {
  const seen = new WeakSet<object>();
  return (_key: string, value: unknown): unknown => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  };
}

/**
 * Maps a specific error type to MCP error using configuration
 */
function mapSpecificError(
  error: BaseError,
  errorMessage: string,
  errorDetails: unknown
): McpError | null {
  for (const mapping of ERROR_TYPE_MAPPINGS) {
    if (error instanceof mapping.type) {
      return new McpError(mapping.code, `${mapping.prefix}: ${errorMessage}`, errorDetails);
    }
  }
  return null;
}

/**
 * Maps internal application errors to standardized MCP errors.
 * This function ensures consistent error mapping across all tool handlers.
 *
 * @param error - The error to be mapped to an MCP error
 * @param toolName - The name of the tool where the error occurred
 * @returns McpError - A properly mapped MCP error
 */
export function mapToMcpError(error: unknown, toolName: string): McpError {
  // If already an McpError, return directly
  if (error instanceof McpError) {
    return error;
  }

  // Extract error information safely
  const errorMessage = extractErrorMessage(error);
  const errorDetails = extractErrorDetails(error);

  // Try to map specific error types
  if (error instanceof BaseError) {
    const mapped = mapSpecificError(error, errorMessage, errorDetails);
    if (mapped) {
      return mapped;
    }

    // Generic BaseError mapping based on HTTP status
    const code =
      error.status >= 400 && error.status < 500 ? ErrorCode.InvalidParams : ErrorCode.InternalError;

    return new McpError(code, errorMessage, errorDetails);
  }

  // Default case for all other errors
  return new McpError(
    ErrorCode.InternalError,
    `[${toolName}] Failed: ${errorMessage}`,
    errorDetails
  );
}
