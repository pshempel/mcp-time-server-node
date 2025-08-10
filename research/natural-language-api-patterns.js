/**
 * Research: How major APIs handle natural language date parsing
 *
 * Based on NATURAL_ENDPOINT_CONVENTIONS.md which says to follow:
 * - Google Calendar API
 * - Microsoft Graph Calendar API
 * - Moment.js / Luxon patterns
 * - Voice assistant patterns (Alexa/Siri/Google)
 */

console.log('=== Natural Language API Research ===\n');

console.log('--- Google Calendar API ---');
console.log('Google Calendar Quick Add feature:');
console.log('  Input: "Meeting tomorrow at 3pm"');
console.log('  Creates: Event with parsed date/time');
console.log('  Note: Uses natural language processing service');
console.log('  Endpoint: events.quickAdd with text parameter');
console.log('  Returns: Full event object with start/end times\n');

console.log('--- Microsoft Graph Calendar ---');
console.log('FindMeetingTimes API:');
console.log('  Input: "next week" as timeConstraint');
console.log('  Interprets: Next Monday-Friday business hours');
console.log('  Note: Focuses on business context');
console.log('  Returns: Suggested meeting slots\n');

console.log('--- Luxon (Modern Moment.js replacement) ---');
console.log('DateTime.fromFormat() with locale:');
console.log('  Does NOT do natural language');
console.log('  Requires exact format strings');
console.log('  BUT: Has relative methods like:');
console.log('    .plus({days: 3})');
console.log('    .startOf("week").plus({days: 2}) // next Tuesday');
console.log('    .setZone("America/New_York")\n');

console.log('--- Alexa/Google Assistant Patterns ---');
console.log('Common phrases they understand:');
console.log('  "tomorrow" -> next calendar day in user timezone');
console.log('  "next Tuesday" -> upcoming Tuesday (skip if today is Tuesday)');
console.log('  "in 3 days" -> exactly 72 hours from now');
console.log('  "tomorrow at 3pm" -> next day at 15:00 local time');
console.log('  "next week" -> Monday of next week');
console.log('  "this weekend" -> Saturday of current week\n');

console.log('--- Chrono.js (Popular NLP Date Library) ---');
console.log('// Not a dependency, but shows common patterns:');
console.log('chrono.parseDate("tomorrow at 3pm")');
console.log('  Returns: Date object');
console.log('  Handles: Complex phrases like "2 weeks from tomorrow"');
console.log('  Context: Uses reference date for relative parsing\n');

console.log('--- Key Patterns Across All ---');
console.log('1. Reference date is critical (usually "now")');
console.log('2. Timezone context matters for "tomorrow" (whose tomorrow?)');
console.log('3. "next [day]" skips current day if it matches');
console.log('4. Business context changes interpretation');
console.log('5. Return both parsed result AND interpretation string\n');

console.log('--- Proposed MCP Endpoint ---');
console.log('Tool: parse_natural_date');
console.log('Input: {');
console.log('  input: "next Tuesday at 3pm",');
console.log('  timezone?: "America/New_York", // defaults to system');
console.log('  reference_date?: "2025-01-09T10:00:00Z", // defaults to now');
console.log('  business_context?: false // affects "next week" interpretation');
console.log('}');
console.log('Output: {');
console.log('  parsed_date: "2025-01-14T15:00:00-05:00",');
console.log('  interpretation: "Next Tuesday at 3:00 PM EST (January 14, 2025)",');
console.log('  timezone_used: "America/New_York",');
console.log('  confidence?: 0.95 // optional: how sure are we?');
console.log('}\n');

console.log('--- Error Cases to Handle ---');
console.log('- Ambiguous: "next Friday" on a Friday');
console.log('- Conflicting: "yesterday at 9am tomorrow"');
console.log('- Too vague: "soon", "later", "sometime"');
console.log('- Out of range: "in 1000 years"');
console.log('- Timezone issues: "tomorrow" at timezone boundary');
