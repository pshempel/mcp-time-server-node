import { CacheTTL } from '../cache/timeCache';
import type { SubtractTimeParams, SubtractTimeResult } from '../types';
import { getConfig } from '../utils/config';
import { debug } from '../utils/debug';
import { resolveTimezone } from '../utils/timezoneUtils';
import { withCache } from '../utils/withCache';

import { addTime } from './addTime';

export function subtractTime(params: SubtractTimeParams): SubtractTimeResult {
  debug.timing('subtractTime called with params: %O', params);

  const { time, amount, unit, timezone } = params;
  const config = getConfig();

  // Determine the effective timezone for cache key
  const effectiveTimezone = resolveTimezone(timezone, config.defaultTimezone);

  // Use withCache wrapper instead of manual cache management
  return withCache(
    `subtract_${time}_${amount}_${unit}_${effectiveTimezone}`,
    CacheTTL.CALCULATIONS,
    () => {
      debug.timing('Delegating to addTime with negated amount: %d', -amount);

      // Subtraction is just addition with negative amount
      const result = addTime({
        time,
        amount: -amount, // Negate the amount
        unit,
        timezone,
      });

      debug.timing('subtractTime returning: %O', result);
      return result;
    }
  );
}
