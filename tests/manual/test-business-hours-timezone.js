#!/usr/bin/env node
const { parseISO, format } = require('date-fns');
const { toDate, formatInTimeZone } = require('date-fns-tz');

console.log('=== Testing Timezone Issues ===\n');

// Test 1: UTC timezone with Z suffix
console.log('1. UTC timezone test:');
const utcTime = '2025-01-20T14:00:00Z';
const utcEnd = '2025-01-20T18:00:00Z';
const utcStart = parseISO(utcTime);
const utcEndDate = parseISO(utcEnd);

console.log('Start:', format(utcStart, 'HH:mm'), 'UTC');
console.log('End:', format(utcEndDate, 'HH:mm'), 'UTC');
console.log('Hours:', (utcEndDate - utcStart) / 1000 / 60 / 60);

// Business hours in UTC: 9 AM - 5 PM
// Start at 2 PM, end at 6 PM
// Should be 3 hours (2 PM - 5 PM)

// Test 2: Tokyo timezone
console.log('\n2. Tokyo timezone test:');
const tokyoTimeStr = '2025-01-20T10:00:00';
const tokyoEndStr = '2025-01-20T14:00:00';

// Parse as Tokyo time
const tokyoStart = toDate(tokyoTimeStr, { timeZone: 'Asia/Tokyo' });
const tokyoEnd = toDate(tokyoEndStr, { timeZone: 'Asia/Tokyo' });

console.log('Tokyo start string:', tokyoTimeStr);
console.log('Tokyo end string:', tokyoEndStr);
console.log('Start in UTC:', tokyoStart.toISOString());
console.log('End in UTC:', tokyoEnd.toISOString());
console.log('Hours difference:', (tokyoEnd - tokyoStart) / 1000 / 60 / 60);

// If 10 AM - 2 PM in Tokyo, that's 4 hours
// Business hours should be calculated in Tokyo time

console.log('\n=== Done ===');
