import { hashCacheKey } from '../cache/cacheKeyHash';
import { cache, CacheTTL } from '../cache/timeCache';
import type { SubtractTimeParams, SubtractTimeResult } from '../types';
import { getConfig } from '../utils/config';

import { addTime } from './addTime';

export function subtractTime(params: SubtractTimeParams): SubtractTimeResult {
  const { time, amount, unit, timezone } = params;
  const config = getConfig();

  // Determine the effective timezone for cache key
  const effectiveTimezone = timezone === '' ? 'UTC' : (timezone ?? config.defaultTimezone);

  // Generate cache key
  const rawCacheKey = `subtract_${time}_${amount}_${unit}_${effectiveTimezone}`;
  const cacheKey = hashCacheKey(rawCacheKey);

  // Check cache
  const cached = cache.get<SubtractTimeResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Subtraction is just addition with negative amount
  const result = addTime({
    time,
    amount: -amount, // Negate the amount
    unit,
    timezone,
  });

  // Cache the result
  cache.set(cacheKey, result, CacheTTL.CALCULATIONS);

  return result;
}
