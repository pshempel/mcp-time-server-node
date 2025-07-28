#!/usr/bin/env node
const { toDate } = require('date-fns-tz');
const { format, eachDayOfInterval } = require('date-fns');

console.log('=== Verify Tokyo Date Parsing ===\n');

const startStr = '2025-01-20T10:00:00';
const endStr = '2025-01-20T14:00:00';

console.log('Input strings:');
console.log('Start:', startStr);
console.log('End:', endStr);

// Parse as Tokyo time
const tokyoStart = toDate(startStr, { timeZone: 'Asia/Tokyo' });
const tokyoEnd = toDate(endStr, { timeZone: 'Asia/Tokyo' });

console.log('\nParsed dates:');
console.log('Start UTC:', tokyoStart.toISOString());
console.log('End UTC:', tokyoEnd.toISOString());

// Get interval
const days = eachDayOfInterval({ start: tokyoStart, end: tokyoEnd });
console.log('\nDays in interval:');
days.forEach((day) => {
  console.log('- ', format(day, 'yyyy-MM-dd EEEE'));
});

// Check what happens when we check business hours on Jan 19th UTC
// which is really Jan 20th Tokyo time
console.log('\nBusiness hours check:');
console.log('Start hour in UTC:', tokyoStart.getUTCHours());
console.log('End hour in UTC:', tokyoEnd.getUTCHours());

// When it's 10 AM in Tokyo, it's 1 AM UTC (previous day)
// When it's 2 PM in Tokyo, it's 5 AM UTC

console.log('\n=== Done ===');
