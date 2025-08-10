#!/usr/bin/env node

// Research script for automated holiday verification approach
// This explores how to create tests that verify our data against expected values

const { getHolidaysForYear } = require('../dist/data/holidays.js');

console.log('=== Automated Holiday Verification Research ===\n');

// Define expected holidays for verification
// These would normally come from external APIs or official sources
const expectedHolidays = {
  US: {
    2025: [
      { name: "New Year's Day", date: '2025-01-01', type: 'fixed' },
      { name: 'Martin Luther King Jr. Day', date: '2025-01-20', type: 'nthWeekday' },
      { name: 'Presidents Day', date: '2025-02-17', type: 'nthWeekday' },
      { name: 'Memorial Day', date: '2025-05-26', type: 'lastWeekday' },
      { name: 'Juneteenth', date: '2025-06-19', type: 'fixed' },
      { name: 'Independence Day', date: '2025-07-04', type: 'fixed' },
      { name: 'Labor Day', date: '2025-09-01', type: 'nthWeekday' },
      { name: 'Columbus Day', date: '2025-10-13', type: 'nthWeekday' },
      { name: 'Veterans Day', date: '2025-11-11', type: 'fixed' },
      { name: 'Thanksgiving', date: '2025-11-27', type: 'nthWeekday' },
      { name: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
    ],
  },
  UK: {
    2025: [
      { name: "New Year's Day", date: '2025-01-01', type: 'fixed' },
      { name: 'Good Friday', date: '2025-04-18', type: 'easter' },
      { name: 'Easter Monday', date: '2025-04-21', type: 'easter' },
      { name: 'Early May Bank Holiday', date: '2025-05-05', type: 'nthWeekday' },
      { name: 'Spring Bank Holiday', date: '2025-05-26', type: 'lastWeekday' },
      { name: 'Summer Bank Holiday', date: '2025-08-25', type: 'lastWeekday' },
      { name: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
      { name: 'Boxing Day', date: '2025-12-26', type: 'fixed' },
    ],
  },
  CA: {
    2025: [
      { name: "New Year's Day", date: '2025-01-01', type: 'fixed' },
      { name: 'Good Friday', date: '2025-04-18', type: 'easter' },
      { name: 'Victoria Day', date: '2025-05-19', type: 'special' },
      { name: 'Canada Day', date: '2025-07-01', type: 'fixed' },
      { name: 'Labour Day', date: '2025-09-01', type: 'nthWeekday' },
      { name: 'Thanksgiving', date: '2025-10-13', type: 'nthWeekday' },
      { name: 'Remembrance Day', date: '2025-11-11', type: 'fixed' },
      { name: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
      { name: 'Boxing Day', date: '2025-12-26', type: 'fixed' },
    ],
  },
  AU: {
    2025: [
      { name: "New Year's Day", date: '2025-01-01', type: 'fixed' },
      { name: 'Australia Day', date: '2025-01-26', type: 'fixed' },
      { name: 'Good Friday', date: '2025-04-18', type: 'easter' },
      { name: 'Easter Saturday', date: '2025-04-19', type: 'easter' },
      { name: 'Easter Monday', date: '2025-04-21', type: 'easter' },
      { name: 'Anzac Day', date: '2025-04-25', type: 'fixed' },
      { name: "Queen's Birthday", date: '2025-06-09', type: 'nthWeekday' },
      { name: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
      { name: 'Boxing Day', date: '2025-12-26', type: 'fixed' },
    ],
  },
};

// Function to verify holidays
function verifyHolidaysForCountry(country, year) {
  console.log(`\nVerifying ${country} holidays for ${year}:`);
  console.log('='.repeat(50));

  const expected = expectedHolidays[country]?.[year] || [];
  const actual = getHolidaysForYear(country, year);

  // Create maps for easy comparison
  const expectedMap = new Map(expected.map((h) => [h.name.toLowerCase(), h]));
  const actualMap = new Map(actual.map((h) => [h.name.toLowerCase(), h]));

  let allCorrect = true;

  // Check each expected holiday
  expected.forEach((expectedHoliday) => {
    const actualHoliday = actualMap.get(expectedHoliday.name.toLowerCase());

    if (!actualHoliday) {
      console.log(`❌ MISSING: ${expectedHoliday.name} (expected ${expectedHoliday.date})`);
      allCorrect = false;
    } else {
      const actualDateStr = actualHoliday.date.toISOString().split('T')[0];
      if (actualDateStr === expectedHoliday.date) {
        console.log(`✅ CORRECT: ${expectedHoliday.name} on ${expectedHoliday.date}`);
      } else {
        console.log(
          `❌ WRONG DATE: ${expectedHoliday.name} - expected ${expectedHoliday.date}, got ${actualDateStr}`,
        );
        allCorrect = false;
      }
    }
  });

  // Check for extra holidays
  actual.forEach((actualHoliday) => {
    if (!expectedMap.has(actualHoliday.name.toLowerCase())) {
      console.log(
        `⚠️  EXTRA: ${actualHoliday.name} on ${actualHoliday.date.toISOString().split('T')[0]}`,
      );
    }
  });

  return allCorrect;
}

// Test all countries
console.log('Testing holiday verification approach:');
Object.keys(expectedHolidays).forEach((country) => {
  verifyHolidaysForCountry(country, 2025);
});

console.log('\n=== Test Structure Ideas ===\n');
console.log('1. Create a separate test file for holiday verification');
console.log('2. Store expected holidays in test fixtures or external JSON');
console.log('3. Run verification for multiple years to catch edge cases');
console.log('4. Test specific holiday calculation types:');
console.log('   - Fixed dates (e.g., July 4)');
console.log('   - Nth weekday (e.g., 3rd Monday)');
console.log('   - Last weekday (e.g., last Monday)');
console.log('   - Easter-based (e.g., Good Friday)');
console.log('   - Special rules (e.g., Victoria Day)');
console.log('5. Consider weekend observation rules');
console.log('6. Add CI/CD integration to run annually');

console.log('\n=== External Data Source Options ===\n');
console.log('1. Static JSON files with verified data');
console.log('2. API integration (with caching/fallback)');
console.log('3. Government website scraping');
console.log('4. npm packages with holiday data');
console.log('5. Combination approach with manual overrides');
