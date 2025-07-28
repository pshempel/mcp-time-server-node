#!/usr/bin/env node

// Test script for verifying CA/AU holidays and cache behavior
// Run this after loading the MCP server in Claude

console.log('=== MCP Time Server Holiday & Cache Test ===\n');

// Test 1: Canada Day 2024 (July 1st)
console.log('Test 1: Canada Day 2024');
console.log('Call get_business_days with:');
console.log(
  JSON.stringify(
    {
      start_date: '2024-06-28',
      end_date: '2024-07-03',
      timezone: 'America/Toronto',
      holidays: ['CA'],
    },
    null,
    2,
  ),
);
console.log('Expected: Should exclude July 1st (Canada Day)\n');

// Test 2: Australia Day 2024 (January 26th)
console.log('Test 2: Australia Day 2024');
console.log('Call get_business_days with:');
console.log(
  JSON.stringify(
    {
      start_date: '2024-01-24',
      end_date: '2024-01-29',
      timezone: 'Australia/Sydney',
      holidays: ['AU'],
    },
    null,
    2,
  ),
);
console.log('Expected: Should exclude January 26th (Australia Day)\n');

// Test 3: ANZAC Day 2024 (April 25th)
console.log('Test 3: ANZAC Day 2024');
console.log('Call get_business_days with:');
console.log(
  JSON.stringify(
    {
      start_date: '2024-04-23',
      end_date: '2024-04-27',
      timezone: 'Australia/Sydney',
      holidays: ['AU'],
    },
    null,
    2,
  ),
);
console.log('Expected: Should exclude April 25th (ANZAC Day)\n');

// Test 4: Multiple countries
console.log('Test 4: Multiple Countries (US Independence Day + Canada Day)');
console.log('Call get_business_days with:');
console.log(
  JSON.stringify(
    {
      start_date: '2024-06-28',
      end_date: '2024-07-05',
      timezone: 'America/New_York',
      holidays: ['US', 'CA'],
    },
    null,
    2,
  ),
);
console.log('Expected: Should exclude both July 1st and July 4th\n');

// Test 5: Cache verification
console.log('Test 5: Cache Behavior');
console.log('Call the same request twice:');
console.log(
  JSON.stringify(
    {
      start_date: '2024-12-20',
      end_date: '2024-12-27',
      timezone: 'America/Toronto',
      holidays: ['CA'],
    },
    null,
    2,
  ),
);
console.log('Expected: Second call should be faster (cached)\n');

// Test 6: Memory limit stress test
console.log('Test 6: Memory Limit (10MB cache)');
console.log('This would require many requests to test properly.');
console.log('The cache implementation includes:');
console.log('- MemoryAwareCache with 10MB limit');
console.log('- Automatic eviction when approaching limit');
console.log('- Memory monitoring\n');

console.log('=== Instructions ===');
console.log('1. Use these test cases with the get_business_days tool in Claude');
console.log('2. Verify the holiday counts match expectations');
console.log('3. For cache testing, run the same request multiple times');
console.log('4. The server logs should show cache hits/misses\n');
