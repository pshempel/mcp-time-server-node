#!/usr/bin/env node

// Comprehensive MCP Server Test Script
// Tests all 9 tools including VE/CL holiday functionality
// This script provides MCP call examples that can be executed via Claude

console.log('🧪 MCP Time Server Comprehensive Test Script');
console.log('============================================\n');

console.log('This script shows the MCP calls to test all server functionality.');
console.log("Execute these through Claude's MCP interface.\n");

const tests = {
  getCurrentTime: [
    {
      name: 'Get current time (default system timezone)',
      call: { tool: 'get_current_time', args: {} },
      validate: 'Should return current time in system timezone',
    },
    {
      name: 'Get current time in UTC',
      call: { tool: 'get_current_time', args: { timezone: '' } },
      validate: 'Should return current time in UTC (empty string = UTC)',
    },
    {
      name: 'Get current time in specific timezone',
      call: { tool: 'get_current_time', args: { timezone: 'America/New_York' } },
      validate: 'Should return current time in Eastern timezone',
    },
    {
      name: 'Get current time with custom format',
      call: { tool: 'get_current_time', args: { format: 'yyyy-MM-dd', timezone: 'Asia/Tokyo' } },
      validate: 'Should return date only in Tokyo timezone',
    },
  ],

  convertTimezone: [
    {
      name: 'Convert time between timezones',
      call: {
        tool: 'convert_timezone',
        args: {
          time: '2025-01-15T10:00:00',
          from_timezone: 'America/New_York',
          to_timezone: 'Europe/London',
        },
      },
      validate: 'Should convert 10 AM EST to 3 PM GMT',
    },
    {
      name: 'Convert with custom format',
      call: {
        tool: 'convert_timezone',
        args: {
          time: '2025-01-15T10:00:00',
          from_timezone: 'UTC',
          to_timezone: 'Australia/Sydney',
          format: "EEEE, MMMM d 'at' h:mm a",
        },
      },
      validate: 'Should show formatted Sydney time',
    },
  ],

  holidays: [
    {
      name: 'Check Venezuela holidays',
      call: {
        tool: 'get_business_days',
        args: {
          start_date: '2025-01-01',
          end_date: '2025-01-02',
          holiday_calendar: 'VE',
        },
      },
      validate: 'Should return 0 business days (Jan 1 is Año Nuevo)',
    },
    {
      name: 'Check Chile Monday-moving rule',
      call: {
        tool: 'get_business_days',
        args: {
          start_date: '2025-06-29',
          end_date: '2025-07-01',
          holiday_calendar: 'CL',
        },
      },
      validate:
        'Should return 0 business days (June 29 is Sunday, June 30 is moved San Pedro holiday)',
    },
    {
      name: 'Check VE Carnival dates (Easter-based)',
      call: {
        tool: 'get_business_days',
        args: {
          start_date: '2025-03-03',
          end_date: '2025-03-05',
          holiday_calendar: 'VE',
        },
      },
      validate: 'Should return 0 business days (March 3-4 are Carnival Monday/Tuesday)',
    },
    {
      name: 'Check multiple country holidays',
      call: {
        tool: 'get_business_days',
        args: {
          start_date: '2025-12-24',
          end_date: '2025-12-26',
          holiday_calendar: 'US',
        },
      },
      validate: 'Should return 1 business day (Dec 24 is not a US federal holiday)',
    },
  ],

  businessDays: [
    {
      name: 'Calculate business days with weekends',
      call: {
        tool: 'get_business_days',
        args: {
          start_date: '2025-01-10',
          end_date: '2025-01-20',
        },
      },
      validate: 'Should return 6 business days (excludes 2 weekends)',
    },
    {
      name: 'Business days with custom holidays',
      call: {
        tool: 'get_business_days',
        args: {
          start_date: '2025-01-01',
          end_date: '2025-01-05',
          holidays: ['2025-01-02', '2025-01-03'],
        },
      },
      validate:
        'Should return 0 business days (Jan 1 is holiday, 2-3 custom holidays, 4-5 weekend)',
    },
  ],

  businessHours: [
    {
      name: 'Calculate business hours',
      call: {
        tool: 'calculate_business_hours',
        args: {
          start_time: '2025-01-13T14:00:00',
          end_time: '2025-01-14T11:00:00',
          timezone: 'America/New_York',
        },
      },
      validate: 'Should return 4 hours (2 PM - 5 PM Monday + 9 AM - 11 AM Tuesday)',
    },
    {
      name: 'Business hours with holidays',
      call: {
        tool: 'calculate_business_hours',
        args: {
          start_time: '2025-12-24T14:00:00',
          end_time: '2025-12-26T11:00:00',
          timezone: 'America/New_York',
          holiday_calendar: 'US',
        },
      },
      validate: 'Should exclude Dec 25 (Christmas)',
    },
  ],

  timeArithmetic: [
    {
      name: 'Add time',
      call: {
        tool: 'add_time',
        args: {
          time: '2025-01-15T10:00:00',
          amount: 5,
          unit: 'days',
        },
      },
      validate: 'Should return Jan 20, 2025',
    },
    {
      name: 'Subtract time',
      call: {
        tool: 'subtract_time',
        args: {
          time: '2025-03-01T10:00:00',
          amount: 1,
          unit: 'months',
        },
      },
      validate: 'Should return Feb 1, 2025',
    },
    {
      name: 'Calculate duration',
      call: {
        tool: 'calculate_duration',
        args: {
          start_time: '2025-01-01T00:00:00',
          end_time: '2025-01-15T12:00:00',
        },
      },
      validate: 'Should return 14 days and 12 hours',
    },
  ],

  nextOccurrence: [
    {
      name: 'Next weekly occurrence',
      call: {
        tool: 'next_occurrence',
        args: {
          pattern: 'weekly',
          day_of_week: 1, // Monday
          time: '10:00',
        },
      },
      validate: 'Should return next Monday at 10 AM',
    },
    {
      name: 'Next monthly occurrence',
      call: {
        tool: 'next_occurrence',
        args: {
          pattern: 'monthly',
          day_of_month: 15,
          time: '14:30',
        },
      },
      validate: 'Should return next 15th at 2:30 PM',
    },
  ],

  formatTime: [
    {
      name: 'Format as relative time',
      call: {
        tool: 'format_time',
        args: {
          time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          format: 'relative',
        },
      },
      validate: "Should return 'an hour ago'",
    },
    {
      name: 'Format as calendar time',
      call: {
        tool: 'format_time',
        args: {
          time: new Date().toISOString(),
          format: 'calendar',
        },
      },
      validate: "Should return 'Today at X:XX PM'",
    },
  ],

  daysUntil: [
    {
      name: 'Days until Christmas 2025',
      call: {
        tool: 'days_until',
        args: {
          target_date: '2025-12-25',
          format_result: true,
        },
      },
      validate: "Should return 'in X days' (formatted)",
    },
    {
      name: 'Days until tomorrow',
      call: {
        tool: 'days_until',
        args: {
          target_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          format_result: true,
        },
      },
      validate: "Should return 'Tomorrow'",
    },
    {
      name: 'Days since last Christmas',
      call: {
        tool: 'days_until',
        args: {
          target_date: '2024-12-25',
          format_result: false,
        },
      },
      validate: 'Should return negative number',
    },
  ],

  errorHandling: [
    {
      name: 'Invalid timezone',
      call: {
        tool: 'get_current_time',
        args: { timezone: 'Invalid/Timezone' },
      },
      validate: 'Should return timezone validation error',
    },
    {
      name: 'Invalid date format',
      call: {
        tool: 'add_time',
        args: {
          time: 'not-a-date',
          amount: 1,
          unit: 'days',
        },
      },
      validate: 'Should return date parsing error',
    },
  ],
};

// Print test cases
console.log('📋 Test Cases to Execute:\n');

let testNumber = 1;
for (const [category, categoryTests] of Object.entries(tests)) {
  console.log(`\n${category.toUpperCase()}`);
  console.log('='.repeat(50));

  for (const test of categoryTests) {
    console.log(`\n${testNumber}. ${test.name}`);
    console.log(`   Tool: ${test.call.tool}`);
    console.log(
      `   Args: ${JSON.stringify(test.call.args, null, 2).split('\n').join('\n         ')}`,
    );
    console.log(`   Expected: ${test.validate}`);
    testNumber++;
  }
}

// Summary
console.log('\n\n📊 Test Coverage Summary');
console.log('='.repeat(50));
console.log(`Total test cases: ${testNumber - 1}`);
console.log('\nTools tested:');
console.log('✓ get_current_time');
console.log('✓ convert_timezone');
console.log('✓ add_time');
console.log('✓ subtract_time');
console.log('✓ calculate_duration');
console.log('✓ get_business_days (with VE/CL holidays)');
console.log('✓ calculate_business_hours');
console.log('✓ next_occurrence');
console.log('✓ format_time');
console.log('✓ days_until');
console.log('\nFeatures tested:');
console.log('✓ Venezuela (VE) holidays');
console.log('✓ Chile (CL) holidays with Monday-moving rule');
console.log('✓ Easter-based holiday calculations');
console.log('✓ Custom holiday lists');
console.log('✓ Timezone conversions');
console.log('✓ Business hours calculations');
console.log('✓ Error handling');

console.log('\n💡 To run these tests:');
console.log("1. Use Claude's MCP interface to execute each tool call");
console.log('2. Verify the response matches the expected result');
console.log('3. Check that errors are properly formatted');
