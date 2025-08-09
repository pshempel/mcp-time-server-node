/**
 * Test chrono-node to verify it actually handles the patterns we need
 */

const chrono = require('chrono-node');

console.log('=== Testing chrono-node capabilities ===\n');

// Test cases
const testCases = [
  'Christmas',
  'next Christmas',
  'tomorrow',
  'next Tuesday',
  'tomorrow at 3pm',
  'in 3 days',
  'last day of March',
  '2 weeks before Christmas',
  'New Year\'s Eve',
  'Thanksgiving', // US holiday
  'Easter Sunday',
  'end of month',
  'beginning of next month',
  'yesterday at noon',
  'next Friday at 2:30pm'
];

// Reference date for consistent testing
const referenceDate = new Date('2025-01-09T10:00:00Z');

console.log('Reference date:', referenceDate.toISOString());
console.log('\nTest results:\n');

testCases.forEach(input => {
  try {
    const result = chrono.parseDate(input, referenceDate);
    if (result) {
      console.log(`✓ "${input}" → ${result.toISOString()}`);
    } else {
      console.log(`✗ "${input}" → Could not parse`);
    }
  } catch (error) {
    console.log(`✗ "${input}" → Error: ${error.message}`);
  }
});

// Test detailed parsing to see what info we get
console.log('\n=== Detailed parse example ===');
const detailed = chrono.parse('Christmas at 3pm', referenceDate);
console.log('Input: "Christmas at 3pm"');
console.log('Result:', JSON.stringify(detailed, null, 2));