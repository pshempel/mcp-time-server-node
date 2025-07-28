#!/usr/bin/env node

// Debug script to investigate why isHoliday returns false for VE/CL

const { getHolidaysForYear, isHoliday } = require('../dist/data/holidays');

console.log('=== Debugging isHoliday for VE/CL ===\n');

// Test dates that should be holidays
const testCases = [
  { date: '2025-01-01', country: 'VE', name: 'Año Nuevo' },
  { date: '2025-03-03', country: 'VE', name: 'Lunes de Carnaval' },
  { date: '2025-01-01', country: 'CL', name: 'Año Nuevo' },
  { date: '2025-06-30', country: 'CL', name: 'San Pedro (moved from 29th)' },
];

// First, let's see what getHolidaysForYear returns
console.log('1. Checking getHolidaysForYear output:\n');

['VE', 'CL'].forEach((country) => {
  console.log(`\n${country} holidays for 2025:`);
  const holidays = getHolidaysForYear(country, 2025);
  console.log(`Found ${holidays.length} holidays`);

  // Show first 3 holidays
  holidays.slice(0, 3).forEach((h) => {
    console.log(`  - ${h.name}: ${h.date.toISOString().split('T')[0]}`);
  });
});

// Now test isHoliday function
console.log('\n\n2. Testing isHoliday function:\n');

testCases.forEach(({ date, country, name }) => {
  const testDate = new Date(date);
  const result = isHoliday(testDate, country);
  console.log(`${country} - ${date} (${name}): ${result ? '✓ PASS' : '✗ FAIL'}`);

  // If it fails, let's debug why
  if (!result) {
    console.log(`  Debugging failure:`);
    const holidays = getHolidaysForYear(country, testDate.getFullYear());
    const expectedHoliday = holidays.find((h) => h.date.toISOString().split('T')[0] === date);

    if (expectedHoliday) {
      console.log(`  - Holiday found in data: ${expectedHoliday.name}`);
      console.log(`  - Holiday date: ${expectedHoliday.date.toISOString()}`);
      console.log(`  - Test date: ${testDate.toISOString()}`);
      console.log(`  - toDateString comparison:`);
      console.log(`    Holiday: ${expectedHoliday.date.toDateString()}`);
      console.log(`    Test: ${testDate.toDateString()}`);
      console.log(`    Equal? ${expectedHoliday.date.toDateString() === testDate.toDateString()}`);
    } else {
      console.log(`  - Holiday NOT found in getHolidaysForYear data!`);
    }
  }
});

// Let's also check the isHoliday function implementation
console.log('\n\n3. Direct comparison test:\n');

const jan1 = new Date('2025-01-01');
const veHolidays = getHolidaysForYear('VE', 2025);
const jan1Holiday = veHolidays.find((h) => h.name === 'Año Nuevo');

if (jan1Holiday) {
  console.log('VE Jan 1 holiday found:');
  console.log(`  Date object: ${jan1Holiday.date}`);
  console.log(`  toISOString: ${jan1Holiday.date.toISOString()}`);
  console.log(`  toDateString: ${jan1Holiday.date.toDateString()}`);
  console.log('\nTest date:');
  console.log(`  Date object: ${jan1}`);
  console.log(`  toISOString: ${jan1.toISOString()}`);
  console.log(`  toDateString: ${jan1.toDateString()}`);
  console.log(`\nDirect comparison: ${jan1Holiday.date.toDateString() === jan1.toDateString()}`);
}
