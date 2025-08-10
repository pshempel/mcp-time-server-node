/**
 * Test date-holidays for holiday parsing
 */

const Holidays = require('date-holidays');
const hd = new Holidays('US'); // US holidays

console.log('=== Testing date-holidays ===\n');

// Get holidays for 2025
const holidays2025 = hd.getHolidays(2025);
console.log('US Holidays in 2025:');
holidays2025.forEach(h => {
  console.log(`- ${h.name}: ${h.date}`);
});

// Check specific holidays
console.log('\n=== Finding specific holidays ===');

// Find Christmas 2025
const christmas = holidays2025.find(h => h.name.includes('Christmas'));
console.log('Christmas 2025:', christmas);

// Find Thanksgiving (4th Thursday of November)
const thanksgiving = holidays2025.find(h => h.name.includes('Thanksgiving'));
console.log('Thanksgiving 2025:', thanksgiving);

// Check if we can search by name
console.log('\n=== Is Christmas a holiday? ===');
const dec25 = hd.isHoliday(new Date('2025-12-25'));
console.log('Dec 25, 2025:', dec25);