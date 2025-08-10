// Research: Verify Canada and Australia holiday dates for 2025

// Canada Federal Holidays (2025)
// Sources: Government of Canada official holidays
const canadaHolidays2025 = [
  { name: "New Year's Day", date: '2025-01-01', type: 'fixed' },
  { name: 'Good Friday', date: '2025-04-18', type: 'easter-based' }, // Need Easter calc
  { name: 'Easter Monday', date: '2025-04-21', type: 'easter-based' }, // Some provinces
  { name: 'Victoria Day', date: '2025-05-19', type: 'floating' }, // Monday before May 25
  { name: 'Canada Day', date: '2025-07-01', type: 'fixed' },
  { name: 'Labour Day', date: '2025-09-01', type: 'floating' }, // First Monday in September
  { name: 'Thanksgiving Day', date: '2025-10-13', type: 'floating' }, // Second Monday in October
  { name: 'Remembrance Day', date: '2025-11-11', type: 'fixed' }, // Not all provinces
  { name: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
  { name: 'Boxing Day', date: '2025-12-26', type: 'fixed' },
];

// Australia National Public Holidays (2025)
// Sources: Australian Government fair work
const australiaHolidays2025 = [
  { name: "New Year's Day", date: '2025-01-01', type: 'fixed' },
  { name: 'Australia Day', date: '2025-01-26', type: 'fixed', observe: '2025-01-27' }, // Falls on Sunday
  { name: 'Good Friday', date: '2025-04-18', type: 'easter-based' },
  { name: 'Easter Saturday', date: '2025-04-19', type: 'easter-based' },
  { name: 'Easter Monday', date: '2025-04-21', type: 'easter-based' },
  { name: 'Anzac Day', date: '2025-04-25', type: 'fixed' },
  { name: "Queen's Birthday", date: '2025-06-09', type: 'floating' }, // 2nd Monday in June (most states)
  { name: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
  { name: 'Boxing Day', date: '2025-12-26', type: 'fixed' },
];

// Calculate floating holidays
console.log('=== Canada Holiday Calculations ===');
console.log('Victoria Day: Monday before May 25');
console.log('  - Always falls between May 18-24');
console.log('  - 2025: May 19 (correct)');
console.log('');
console.log('Labour Day: First Monday in September');
console.log('  - 2025: September 1 (correct)');
console.log('');
console.log('Thanksgiving: Second Monday in October');
console.log('  - 2025: October 13 (correct)');

console.log('\n=== Australia Holiday Calculations ===');
console.log("Queen's Birthday: Second Monday in June (except WA & QLD)");
console.log('  - 2025: June 9 (correct)');
console.log('');
console.log('Weekend observation rules:');
console.log('  - Saturday holidays: Usually not observed on Monday');
console.log('  - Sunday holidays: Observed on Monday');
console.log('  - Australia Day 2025: Jan 26 (Sun) → Jan 27 (Mon)');

// Holiday definition format for our system
console.log('\n=== Implementation Notes ===');
console.log('Canada:');
console.log('- Use us_federal observe rules (similar weekend rules)');
console.log('- Victoria Day needs special calculation (Monday on or before May 24)');
console.log('- Good Friday/Easter Monday need Easter calculation (marked as placeholders)');
console.log('');
console.log('Australia:');
console.log('- Custom observe rules needed (Sunday→Monday, Saturday→no change)');
console.log("- Queen's Birthday varies by state (use June for federal)");
console.log('- Has Easter Saturday (not common in other countries)');

// Test Victoria Day calculation
function getVictoriaDay(year) {
  // Monday on or before May 24
  const may24 = new Date(year, 4, 24); // May is month 4
  const dayOfWeek = may24.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const victoriaDay = new Date(may24);
  victoriaDay.setDate(24 - daysToSubtract);
  return victoriaDay.toISOString().split('T')[0];
}

console.log('\n=== Victoria Day Algorithm Test ===');
for (let year = 2023; year <= 2027; year++) {
  console.log(`${year}: ${getVictoriaDay(year)}`);
}
// Expected: 2023-05-22, 2024-05-20, 2025-05-19, 2026-05-18, 2027-05-24
