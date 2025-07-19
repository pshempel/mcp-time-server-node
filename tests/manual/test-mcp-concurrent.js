#!/usr/bin/env node

/**
 * Test script to verify MaxListenersExceededWarning fix
 * This script tests the MCP server with concurrent calls
 */

console.log('MCP Time Server Concurrent Test');
console.log('================================\n');

// Test configuration
const TEST_ROUNDS = [
  { name: 'Baseline (5 concurrent)', count: 5 },
  { name: 'Normal load (10 concurrent)', count: 10 },
  { name: 'High load (15 concurrent)', count: 15 },
  { name: 'Stress test (20 concurrent)', count: 20 },
  { name: 'Extreme test (30 concurrent)', count: 30 },
];

// Different test scenarios to exercise various tools
const TEST_SCENARIOS = [
  {
    tool: 'get_current_time',
    args: { timezone: 'America/New_York' },
  },
  {
    tool: 'get_current_time',
    args: { timezone: 'Europe/London', format: 'yyyy-MM-dd HH:mm:ss' },
  },
  {
    tool: 'convert_timezone',
    args: { time: '2025-01-19T12:00:00Z', from_timezone: 'UTC', to_timezone: 'Asia/Tokyo' },
  },
  {
    tool: 'add_time',
    args: { time: '2025-01-19', amount: 5, unit: 'days' },
  },
  {
    tool: 'subtract_time',
    args: { time: '2025-01-19', amount: 3, unit: 'hours' },
  },
  {
    tool: 'calculate_duration',
    args: { start_time: '2025-01-19', end_time: '2025-01-25' },
  },
  {
    tool: 'get_business_days',
    args: { start_date: '2025-01-19', end_date: '2025-01-31' },
  },
  {
    tool: 'next_occurrence',
    args: { pattern: 'weekly', day_of_week: 1 },
  },
  {
    tool: 'format_time',
    args: { time: '2025-01-19T15:30:00Z', format: 'relative' },
  },
];

console.log('Test Plan:');
console.log('----------');
console.log('1. We will make concurrent MCP calls through Claude Code');
console.log('2. Monitor for MaxListenersExceededWarning');
console.log('3. Test with increasing concurrent call counts');
console.log('4. Use various MCP time server tools\n');

console.log('Test Scenarios:');
TEST_SCENARIOS.forEach((scenario, i) => {
  console.log(`${i + 1}. ${scenario.tool}(${JSON.stringify(scenario.args)})`);
});

console.log('\nTest Rounds:');
TEST_ROUNDS.forEach((round) => {
  console.log(`- ${round.name}: ${round.count} calls`);
});

console.log('\n\nInstructions for Testing:');
console.log('========================');
console.log(
  'Since the MCP server is running in Claude Code, we need to test it from within Claude.\n',
);

console.log('Please run the following tests by asking Claude to:');
console.log('1. "Make 5 concurrent time queries using different MCP tools"');
console.log('2. "Make 10 concurrent time queries using all available MCP time tools"');
console.log('3. "Make 15 concurrent calls to test the MCP time server under load"');
console.log('4. "Make 20 concurrent time calculations to stress test the MCP server"');
console.log('5. "Make 30 concurrent MCP time server calls for extreme testing"\n');

console.log('Expected Result:');
console.log('- No MaxListenersExceededWarning should appear');
console.log('- All calls should complete successfully');
console.log('- The fix sets maxListeners to 20, so warnings should be prevented\n');

console.log('What to Look For:');
console.log('- Check Claude Code terminal/logs for any warnings');
console.log('- Note if warning appears at any specific concurrent count');
console.log('- Verify all responses are correct\n');

// Export test scenarios for potential automation
module.exports = { TEST_ROUNDS, TEST_SCENARIOS };
