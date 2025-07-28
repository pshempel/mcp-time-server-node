const { parseISO } = require('date-fns');

console.log('=== Holiday Date Comparison Debug ===\n');

// Test scenario
const startDate = parseISO('2025-01-01');
const endDate = parseISO('2025-01-01');
const holiday = new Date(2025, 0, 1); // Jan 1, 2025

console.log('Start date:', startDate.toString());
console.log('End date:', endDate.toString());
console.log('Holiday date:', holiday.toString());

console.log('\nDate comparisons:');
console.log('holiday >= startDate:', holiday >= startDate);
console.log('holiday <= endDate:', holiday <= endDate);

console.log('\nDate strings:');
console.log('startDate.toDateString():', startDate.toDateString());
console.log('holiday.toDateString():', holiday.toDateString());

console.log('\nTime values:');
console.log('startDate.getTime():', startDate.getTime());
console.log('holiday.getTime():', holiday.getTime());
