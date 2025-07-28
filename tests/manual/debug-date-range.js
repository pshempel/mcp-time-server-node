#!/usr/bin/env node
const { toDate, formatInTimeZone } = require('date-fns-tz');
const { eachDayOfInterval, format } = require('date-fns');

console.log('=== Debug Date Range ===\n');

const startStr = '2025-01-21T10:00:00';
const endStr = '2025-01-21T14:00:00';
const timezone = 'Asia/Tokyo';

// Parse as Tokyo time
const startDate = toDate(startStr, { timeZone: timezone });
const endDate = toDate(endStr, { timeZone: timezone });

console.log('Start:', startStr, '(Tokyo)');
console.log('End:', endStr, '(Tokyo)');
console.log('Start UTC:', startDate.toISOString());
console.log('End UTC:', endDate.toISOString());

// Get dates in business timezone
const startDateInBizTz = formatInTimeZone(startDate, timezone, 'yyyy-MM-dd');
const endDateInBizTz = formatInTimeZone(endDate, timezone, 'yyyy-MM-dd');

console.log('\nDates in Tokyo timezone:');
console.log('Start date:', startDateInBizTz);
console.log('End date:', endDateInBizTz);

// Create date range
const firstDayStart = toDate(startDateInBizTz + 'T00:00:00', { timeZone: timezone });
const lastDayEnd = toDate(endDateInBizTz + 'T23:59:59', { timeZone: timezone });

console.log('\nRange for eachDayOfInterval:');
console.log('First day start:', firstDayStart.toISOString());
console.log('Last day end:', lastDayEnd.toISOString());

const days = eachDayOfInterval({ start: firstDayStart, end: lastDayEnd });
console.log('\nDays from interval:', days.length);
days.forEach((d) => {
  console.log('-', format(d, 'yyyy-MM-dd'), formatInTimeZone(d, timezone, 'yyyy-MM-dd EEEE'));
});

console.log('\n=== Done ===');
