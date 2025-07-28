#!/usr/bin/env node
const { formatInTimeZone } = require('date-fns-tz');

console.log('=== Debug Day Format ===\n');

// Test date: Jan 21, 2025 is a Tuesday
const testDate = new Date('2025-01-21T10:00:00Z');

console.log('Test date:', testDate.toISOString());
console.log('Day in UTC:', testDate.toUTCString());

// Check different formats
console.log('\ndate-fns formats:');
console.log('e format (1-7):', formatInTimeZone(testDate, 'Asia/Tokyo', 'e'));
console.log('i format (1-7):', formatInTimeZone(testDate, 'Asia/Tokyo', 'i'));
console.log('EEEE format:', formatInTimeZone(testDate, 'Asia/Tokyo', 'EEEE'));

// Our array: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// Index:     [    0   ,    1    ,     2    ,      3     ,      4     ,    5    ,     6     ]

console.log('\nMapping:');
console.log('Tuesday should be index 2');
console.log('e=2 (Tuesday in 1-7) should map to index 2');

console.log('\n=== Done ===');
