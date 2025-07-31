#!/usr/bin/env node

/**
 * Research script to analyze addTime.ts complexity
 * Current: 121 lines, complexity 29
 *
 * Key timezone behavior to remember:
 * - Empty string "" → UTC (explicit Unix convention)
 * - undefined/missing → System timezone (LLM friendly)
 * - Any other value → That specific timezone
 */

console.log('=== addTime.ts Complexity Analysis ===\n');

console.log('Current Structure Analysis:');
console.log('1. Early parameter validation (lines 30-77)');
console.log('   - Date input validation');
console.log('   - Timezone resolution (empty string → UTC)');
console.log('   - Cache check');
console.log('   - Unit validation');
console.log('   - Amount validation');
console.log('   - Timezone validation\n');

console.log('2. Date parsing logic (lines 79-129) - MAJOR COMPLEXITY');
console.log('   - Unix timestamp handling');
console.log('   - Z suffix handling');
console.log('   - Explicit offset handling (+05:00)');
console.log('   - Local time handling');
console.log('   - Multiple nested conditions\n');

console.log('3. Calculation (lines 131-134) - SIMPLE');
console.log('   - Just calls date-fns function\n');

console.log('4. Result formatting (lines 136-185) - MAJOR COMPLEXITY');
console.log('   - Different formatting based on input type');
console.log('   - Unix timestamp formatting');
console.log('   - Z suffix formatting');
console.log('   - Explicit offset formatting (complex!)');
console.log('   - Local time formatting\n');

console.log('5. Result building & caching (lines 187-197) - SIMPLE\n');

console.log('=== Complexity Sources ===');
console.log('1. Date parsing: ~10 complexity (nested if/else)');
console.log('2. Result formatting: ~15 complexity (nested if/else)');
console.log('3. Validations: ~4 complexity\n');

console.log('=== Proposed Refactoring Phases ===\n');

console.log('Phase 1: Extract validation helpers');
console.log('- validateUnit(unit)');
console.log('- validateAmount(amount)');
console.log('- Expected reduction: ~2 complexity, ~15 lines\n');

console.log('Phase 2: Extract date parsing helper');
console.log('- parseDateWithTimezone(time, timezone)');
console.log(
  '- Returns: { date: Date, displayTimezone: string, hasExplicitOffset: boolean, explicitOffset: string }'
);
console.log('- Expected reduction: ~10 complexity, ~40 lines\n');

console.log('Phase 3: Extract result formatting helper');
console.log('- formatAddTimeResult(inputDate, resultDate, time, params, parseInfo)');
console.log('- Expected reduction: ~15 complexity, ~45 lines\n');

console.log('Expected Final State:');
console.log('- Main function: ~50 lines (from 121)');
console.log('- Complexity: ~10 (from 29)');
console.log('- Much clearer separation of concerns\n');

console.log('=== Key Testing Areas ===');
console.log('1. Timezone behavior (empty string vs undefined)');
console.log('2. Unix timestamps');
console.log('3. ISO strings with Z');
console.log('4. Strings with explicit offset (+05:00)');
console.log('5. Local time strings');
console.log('6. Result formatting for each input type\n');

// Test timezone resolution logic
console.log('=== Testing Timezone Resolution ===');
const config = { defaultTimezone: 'America/New_York' };

function resolveTimezone(paramTimezone, defaultTimezone) {
  return paramTimezone === '' ? 'UTC' : (paramTimezone ?? defaultTimezone);
}

console.log('Empty string:', resolveTimezone('', config.defaultTimezone)); // UTC
console.log('Undefined:', resolveTimezone(undefined, config.defaultTimezone)); // America/New_York
console.log('Specific:', resolveTimezone('Europe/Paris', config.defaultTimezone)); // Europe/Paris
