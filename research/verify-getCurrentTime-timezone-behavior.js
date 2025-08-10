#!/usr/bin/env node

/**
 * Research script to understand getCurrentTime timezone behavior
 * CRITICAL: Empty string "" = UTC, undefined = system timezone
 */

const { formatInTimeZone } = require('date-fns-tz');
const { format } = require('date-fns');

console.log('=== getCurrentTime Timezone Behavior Research ===\n');

// Test current implementation behavior
function testTimezoneLogic(timezone) {
  const now = new Date();

  // This is the current logic from getCurrentTime.ts
  const effectiveTimezone =
    timezone === '' ? 'UTC' : timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  console.log(`Input timezone: ${JSON.stringify(timezone)}`);
  console.log(`Effective timezone: ${effectiveTimezone}`);

  // Show what the time would be
  const formatted = formatInTimeZone(now, effectiveTimezone, 'yyyy-MM-dd HH:mm:ss zzz');
  console.log(`Result: ${formatted}`);
  console.log('---');
}

// Test all three cases
console.log('1. UNDEFINED (should use system timezone):');
testTimezoneLogic(undefined);

console.log('\n2. EMPTY STRING (should use UTC):');
testTimezoneLogic('');

console.log('\n3. SPECIFIC TIMEZONE (should use that timezone):');
testTimezoneLogic('America/New_York');

console.log('\n=== Key Implementation Notes ===');
console.log('- undefined/missing → System timezone (friendly for "what time is it?")');
console.log('- Empty string "" → UTC (explicit Unix convention)');
console.log('- Any other value → That specific timezone');
console.log("\nThis follows Anthropic's reference design for LLM interactions");
