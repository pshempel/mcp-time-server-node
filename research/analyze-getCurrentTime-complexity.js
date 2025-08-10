#!/usr/bin/env node

/**
 * Analyze getCurrentTime.ts complexity to plan refactoring
 */

console.log('=== getCurrentTime.ts Complexity Analysis ===\n');

console.log('Current stats:');
console.log('- Lines: 57 (limit: 50)');
console.log('- Complexity: 17 (limit: 10)');
console.log('');

console.log('Complexity contributors:');
console.log('1. Main function entry: +1');
console.log('2. if (params.format) validation: +1');
console.log('3. Ternary for timezone (=== ""): +2');
console.log('4. Ternary for timezone (?? config): +2');
console.log('5. if (cached) return: +1');
console.log('6. if (!validateTimezone) throw: +1');
console.log('7. try/catch block: +1');
console.log('8. if (includeOffset && !params.format): +2');
console.log('9. else if (!includeOffset && params.format): +2');
console.log('10. else: +1');
console.log('11. Ternary for offset (=== "UTC"): +2');
console.log('12. catch with instanceof RangeError: +1');
console.log('13. && error.message.includes: +1');
console.log('');
console.log('Total complexity: ~17');
console.log('');

console.log('=== Refactoring Plan ===\n');

console.log('Extract these functions:');
console.log('');

console.log('1. resolveTimezone(timezone?: string, config: Config): string');
console.log('   - Handles the empty string "" → UTC logic');
console.log('   - Handles undefined → system timezone logic');
console.log('   - Reduces complexity by ~4');
console.log('');

console.log('2. getCacheKey(timezone: string, format: string, includeOffset: boolean): string');
console.log('   - Generates and hashes cache key');
console.log('   - Reduces lines by ~3');
console.log('');

console.log(
  '3. formatTimeWithOptions(now: Date, timezone: string, params: GetCurrentTimeParams, formatStr: string): string'
);
console.log('   - Contains the 3-way if/else logic for formatting');
console.log('   - Reduces complexity by ~4');
console.log('');

console.log(
  '4. buildTimeResult(now: Date, formattedTime: string, timezone: string): GetCurrentTimeResult'
);
console.log('   - Builds the result object');
console.log('   - Extracts offset logic');
console.log('   - Reduces lines by ~8');
console.log('');

console.log('5. handleFormatError(error: unknown, format: string): never');
console.log('   - Handles the catch block error processing');
console.log('   - Reduces complexity by ~3');
console.log('');

console.log('Expected after refactoring:');
console.log('- Main function lines: ~35-40 (under 50 ✓)');
console.log('- Main function complexity: ~8-10 (at limit ✓)');
console.log('');

console.log('=== CRITICAL: Timezone Logic ===');
console.log('- Empty string "" MUST map to UTC (Unix convention)');
console.log('- undefined/missing MUST map to system timezone (LLM friendliness)');
console.log('- This is core to the MCP server design!');
