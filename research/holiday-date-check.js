#!/usr/bin/env node

/**
 * Research script to understand holiday date checking
 * Created: 2025-08-08
 */

const { format } = require('date-fns');

const holidayDate = new Date('2025-01-20T00:00:00Z');
const dayDateStr = '2025-01-20';

console.log('Holiday Date:', holidayDate);
console.log('Holiday Date ISO:', holidayDate.toISOString());
console.log('Holiday Date ISO slice:', holidayDate.toISOString().slice(0, 10));
console.log('Holiday Date formatted:', format(holidayDate, 'yyyy-MM-dd'));
console.log('Day Date String:', dayDateStr);

console.log('\nComparisons:');
console.log('ISO slice === dayDateStr:', holidayDate.toISOString().slice(0, 10) === dayDateStr);
console.log('format === dayDateStr:', format(holidayDate, 'yyyy-MM-dd') === dayDateStr);

// Test with UTC date
const holidayUTC = new Date(Date.UTC(2025, 0, 20)); // Jan 20, 2025 UTC
console.log('\nUTC Holiday Date:', holidayUTC);
console.log('UTC Holiday formatted:', format(holidayUTC, 'yyyy-MM-dd'));
console.log('UTC format === dayDateStr:', format(holidayUTC, 'yyyy-MM-dd') === dayDateStr);
