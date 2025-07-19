import { formatInTimeZone } from 'date-fns-tz';
import { cache, CacheTTL } from '../cache/timeCache';
import { validateTimezone, createError } from '../utils/validation';
import { getConfig } from '../utils/config';
import { TimeServerErrorCodes } from '../types';
import type { GetCurrentTimeParams, GetCurrentTimeResult } from '../types';

export function getCurrentTime(params: GetCurrentTimeParams): GetCurrentTimeResult {
  // Default values - use system default if no timezone specified
  const config = getConfig();
  const timezone = params.timezone === '' ? 'UTC' : (params.timezone ?? config.defaultTimezone);
  const formatStr = params.format ?? "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";
  const includeOffset = params.include_offset !== false;

  // Generate cache key
  const cacheKey = `current_${timezone}_${formatStr}_${includeOffset}`;

  // Check cache
  const cached = cache.get<GetCurrentTimeResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Validate timezone
  if (!validateTimezone(timezone)) {
    throw {
      error: createError(TimeServerErrorCodes.INVALID_TIMEZONE, `Invalid timezone: ${timezone}`, {
        timezone,
      }),
    };
  }

  const now = new Date();

  try {
    // Format time in the target timezone
    let formattedTime: string;
    if (includeOffset && !params.format) {
      // Default format includes offset
      formattedTime = formatInTimeZone(now, timezone, formatStr);
    } else if (!includeOffset && params.format) {
      // Custom format without offset - just use the format as-is
      formattedTime = formatInTimeZone(now, timezone, params.format);
    } else {
      // Use format string as provided
      formattedTime = formatInTimeZone(now, timezone, formatStr);
    }

    // Get offset separately for the result object
    const offset = timezone === 'UTC' ? 'Z' : formatInTimeZone(now, timezone, 'XXX');

    // Create result
    const result: GetCurrentTimeResult = {
      time: formattedTime,
      timezone: timezone,
      offset: offset,
      unix: Math.floor(now.getTime() / 1000),
      iso: formatInTimeZone(now, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
    };

    // Cache the result
    cache.set(cacheKey, result, CacheTTL.CURRENT_TIME);

    return result;
  } catch (error: unknown) {
    // Handle format errors from date-fns
    if (
      error instanceof RangeError ||
      (error instanceof Error && error.message.includes('format'))
    ) {
      throw {
        error: createError(
          TimeServerErrorCodes.INVALID_DATE_FORMAT,
          `Invalid format: ${error.message}`,
          { format: params.format ?? formatStr, error: error.message },
        ),
      };
    }
    throw error;
  }
}
