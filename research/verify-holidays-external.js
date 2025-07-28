#!/usr/bin/env node

// Script to verify our holiday data against external sources
// This would normally fetch from official APIs or scrape government sites
// For now, we'll document what should be verified

console.log('=== Holiday Verification Against External Sources ===\n');

console.log('MANUAL VERIFICATION NEEDED:\n');

console.log('🇺🇸 United States Federal Holidays 2025:');
console.log('Source: https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/');
console.log("- New Year's Day: January 1 (Wednesday)");
console.log('- Martin Luther King Jr. Day: January 20 (3rd Monday)');
console.log('- Presidents Day: February 17 (3rd Monday)');
console.log('- Memorial Day: May 26 (Last Monday)');
console.log('- Juneteenth: June 19 (Thursday)');
console.log('- Independence Day: July 4 (Friday)');
console.log('- Labor Day: September 1 (1st Monday)');
console.log('- Columbus Day: October 13 (2nd Monday)');
console.log('- Veterans Day: November 11 (Tuesday)');
console.log('- Thanksgiving: November 27 (4th Thursday)');
console.log('- Christmas: December 25 (Thursday)\n');

console.log('🇬🇧 UK Bank Holidays 2025:');
console.log('Source: https://www.gov.uk/bank-holidays');
console.log("- New Year's Day: January 1");
console.log('- Good Friday: April 18');
console.log('- Easter Monday: April 21');
console.log('- Early May: May 5 (1st Monday)');
console.log('- Spring: May 26 (Last Monday)');
console.log('- Summer: August 25 (Last Monday)');
console.log('- Christmas: December 25');
console.log('- Boxing Day: December 26\n');

console.log('🇨🇦 Canada Federal Holidays 2025:');
console.log('Source: https://www.canada.ca/en/revenue-agency/services/tax/public-holidays.html');
console.log("- New Year's Day: January 1");
console.log('- Good Friday: April 18');
console.log('- Victoria Day: May 19 (Monday before May 25)');
console.log('- Canada Day: July 1');
console.log('- Civic Holiday: August 4 (1st Monday - not all provinces)');
console.log('- Labour Day: September 1');
console.log('- Thanksgiving: October 13 (2nd Monday)');
console.log('- Remembrance Day: November 11 (not all provinces)');
console.log('- Christmas: December 25');
console.log('- Boxing Day: December 26\n');

console.log('🇦🇺 Australia National Holidays 2025:');
console.log(
  'Source: https://www.australia.gov.au/about-australia/special-dates-and-events/public-holidays',
);
console.log("- New Year's Day: January 1");
console.log('- Australia Day: January 26 (Monday, Jan 27 observed)');
console.log('- Good Friday: April 18');
console.log('- Easter Saturday: April 19');
console.log('- Easter Monday: April 21');
console.log('- Anzac Day: April 25');
console.log("- Queen's Birthday: June 9 (2nd Monday - varies by state)");
console.log('- Christmas: December 25');
console.log('- Boxing Day: December 26\n');

console.log('=== Verification Process ===\n');
console.log('1. Run our getHolidaysForYear() for each country');
console.log('2. Compare dates with official sources above');
console.log('3. Note any discrepancies');
console.log('4. Update holiday data if needed');
console.log('5. Document source URLs in code comments\n');

console.log('=== API Options for Automation ===\n');
console.log('Free APIs that could automate this:');
console.log('- Nager.Date API: https://date.nager.at/');
console.log('- Calendarific: https://calendarific.com/ (requires API key)');
console.log('- Abstract API: https://www.abstractapi.com/holidays-api');
console.log('- Holiday API: https://holidayapi.com/ (limited free tier)\n');

// Let's actually test our implementation
const { getHolidaysForYear } = require('../dist/data/holidays.js');

console.log('=== Testing Our Implementation ===\n');

// Test US holidays for 2025
console.log('US Holidays 2025 (from our data):');
const usHolidays2025 = getHolidaysForYear('US', 2025);
usHolidays2025.forEach((h) => {
  const dateStr = h.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  console.log(`- ${h.name}: ${dateStr}`);
});

console.log('\n⚠️  MANUAL VERIFICATION REQUIRED:');
console.log('Compare the above output with the official sources listed');
console.log('Pay special attention to:');
console.log('- Floating holiday calculations');
console.log('- Weekend observation rules');
console.log('- Recently added holidays (Juneteenth)');
console.log('- Regional variations');
