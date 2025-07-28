#!/usr/bin/env node

// Live MCP Security Test Runner
// This script provides test cases to run through Claude's MCP interface

console.log('🔒 Live MCP Security Test Suite');
console.log('================================\n');

const securityTests = [
  {
    name: 'Path Traversal - Date Parameter',
    tool: 'get_business_days',
    params: {
      start_date: '../../../etc/passwd',
      end_date: '2025-01-05',
    },
    expected: 'Error - invalid date format',
  },
  {
    name: 'SQL Injection - Timezone',
    tool: 'get_current_time',
    params: {
      timezone: "'; DROP TABLE users; --",
    },
    expected: 'Error - invalid timezone',
  },
  {
    name: 'XSS - Custom Format String',
    tool: 'format_time',
    params: {
      time: '2025-01-01T12:00:00',
      format: 'custom',
      custom_format: "<script>alert('xss')</script>",
    },
    expected: 'Error - invalid format string',
  },
  {
    name: 'Command Injection - Format String',
    tool: 'format_time',
    params: {
      time: '2025-01-01T12:00:00',
      format: 'custom',
      custom_format: 'yyyy-MM-dd; rm -rf /',
    },
    expected: 'Error - invalid format string (dangerous chars)',
  },
  {
    name: 'Command Injection - Timezone',
    tool: 'get_current_time',
    params: {
      timezone: 'UTC; cat /etc/passwd',
    },
    expected: 'Error - invalid timezone',
  },
  {
    name: 'DoS - Long String',
    tool: 'get_current_time',
    params: {
      timezone: 'A'.repeat(10000),
    },
    expected: 'Error - string too long',
  },
  {
    name: 'DoS - Large Date Range',
    tool: 'get_business_days',
    params: {
      start_date: '1000-01-01',
      end_date: '9999-12-31',
    },
    expected: 'Should complete within reasonable time',
  },
  {
    name: 'Null Byte - Timezone',
    tool: 'get_current_time',
    params: {
      timezone: 'UTC\\x00admin',
    },
    expected: 'Error - invalid timezone',
  },
  {
    name: 'Null Byte - Holiday Calendar',
    tool: 'get_business_days',
    params: {
      start_date: '2025-01-01',
      end_date: '2025-01-10',
      holiday_calendar: 'US\\x00admin',
    },
    expected: 'Error - invalid holiday_calendar',
  },
  {
    name: 'Invalid Unit Type',
    tool: 'add_time',
    params: {
      time: '2025-01-01',
      amount: 1,
      unit: "'; DROP TABLE; --",
    },
    expected: 'Error - invalid unit',
  },
  {
    name: 'Non-string Date (Object)',
    tool: 'add_time',
    params: {
      time: { toString: '2025-01-01' },
      amount: 1,
      unit: 'days',
    },
    expected: 'Error - date must be string or number',
  },
  {
    name: 'Prototype Pollution',
    tool: 'get_business_days',
    params: {
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      __proto__: { polluted: true },
    },
    expected: 'Normal response, no pollution',
  },
  {
    name: 'Invalid Holiday Calendar',
    tool: 'get_business_days',
    params: {
      start_date: '2025-01-01',
      end_date: '2025-01-10',
      holiday_calendar: 'INVALID123',
    },
    expected: 'Error - must be 2-3 letter country code',
  },
];

// Print test cases for manual execution
console.log("Run these tests through Claude's MCP interface:\n");

securityTests.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`Tool: mcp__time-server-test__${test.tool}`);
  console.log(`Parameters: ${JSON.stringify(test.params, null, 2)}`);
  console.log(`Expected: ${test.expected}`);
  console.log('---\n');
});

console.log('Security Checklist:');
console.log('✓ All invalid inputs should return proper errors');
console.log('✓ No system paths or internal errors should leak');
console.log('✓ No crashes or unhandled exceptions');
console.log('✓ Large inputs handled gracefully');
console.log('✓ Special characters properly escaped');
console.log('✓ Cache keys are sanitized (hashed)');

console.log('\n💡 Note: The MCP layer may handle errors differently than direct function calls.');
console.log('Empty responses or "Tool ran without output" may indicate caught errors.');
