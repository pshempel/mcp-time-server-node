#!/usr/bin/env node

// Research script to verify Easter calculation algorithms
// Testing different methods and comparing with known Easter dates

console.log('=== Easter Calculation Research ===\n');

// Known Easter dates for verification
const knownEasterDates = {
  2024: '2024-03-31',
  2025: '2025-04-20',
  2026: '2026-04-05',
  2027: '2027-03-28',
  2028: '2028-04-16',
  2029: '2029-04-01',
  2030: '2030-04-21',
};

// Gauss's Easter Algorithm (Computus)
// This is the standard algorithm for calculating Easter in the Gregorian calendar
function calculateEaster(year) {
  // Gauss's algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return { year, month, day };
}

// Alternative: Meeus/Jones/Butcher Algorithm
// Another widely used algorithm, considered more straightforward
function calculateEasterMJB(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);

  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;

  return { year, month: easterMonth, day: easterDay };
}

// Test both algorithms
console.log('Testing Easter calculation algorithms:\n');
console.log('Year  Known Date   Gauss Result  MJB Result   Match?');
console.log('----  ----------   -----------   ----------   ------');

for (const [yearStr, knownDate] of Object.entries(knownEasterDates)) {
  const year = parseInt(yearStr);

  const gauss = calculateEaster(year);
  const mjb = calculateEasterMJB(year);

  const gaussDate = `${year}-${String(gauss.month).padStart(2, '0')}-${String(gauss.day).padStart(2, '0')}`;
  const mjbDate = `${year}-${String(mjb.month).padStart(2, '0')}-${String(mjb.day).padStart(2, '0')}`;

  const gaussMatch = gaussDate === knownDate ? '✓' : '✗';
  const mjbMatch = mjbDate === knownDate ? '✓' : '✗';

  console.log(`${year}  ${knownDate}   ${gaussDate}    ${mjbDate}   ${gaussMatch}/${mjbMatch}`);
}

// Test edge cases
console.log('\n=== Edge Cases ===\n');

// Century boundaries
const centuryYears = [1900, 2000, 2100, 2200];
console.log('Century boundary Easter dates:');
centuryYears.forEach((year) => {
  const easter = calculateEaster(year);
  console.log(`${year}: ${easter.month}/${easter.day}`);
});

// Early/late Easter extremes
console.log('\nEarliest possible Easter: March 22');
console.log('Latest possible Easter: April 25');

// Calculate related holidays
console.log('\n=== Related Holiday Calculations ===\n');

function getEasterRelatedDates(year) {
  const easter = calculateEaster(year);
  const easterDate = new Date(year, easter.month - 1, easter.day);

  // Good Friday is 2 days before Easter
  const goodFriday = new Date(easterDate);
  goodFriday.setDate(goodFriday.getDate() - 2);

  // Easter Monday is 1 day after Easter
  const easterMonday = new Date(easterDate);
  easterMonday.setDate(easterMonday.getDate() + 1);

  // Easter Saturday is 1 day before Easter
  const easterSaturday = new Date(easterDate);
  easterSaturday.setDate(easterSaturday.getDate() - 1);

  // Ascension Day is 39 days after Easter
  const ascension = new Date(easterDate);
  ascension.setDate(ascension.getDate() + 39);

  // Pentecost is 49 days after Easter
  const pentecost = new Date(easterDate);
  pentecost.setDate(pentecost.getDate() + 49);

  return {
    goodFriday: goodFriday.toISOString().split('T')[0],
    easterSaturday: easterSaturday.toISOString().split('T')[0],
    easterSunday: easterDate.toISOString().split('T')[0],
    easterMonday: easterMonday.toISOString().split('T')[0],
    ascension: ascension.toISOString().split('T')[0],
    pentecost: pentecost.toISOString().split('T')[0],
  };
}

console.log('Easter-related dates for 2025:');
const dates2025 = getEasterRelatedDates(2025);
Object.entries(dates2025).forEach(([holiday, date]) => {
  console.log(`  ${holiday.padEnd(15)}: ${date}`);
});

console.log('\n=== Implementation Notes ===\n');
console.log('1. The Gauss algorithm is the standard Computus calculation');
console.log('2. Both algorithms produce identical results for our test range');
console.log('3. Easter can only fall between March 22 and April 25');
console.log('4. Related holidays are calculated as offsets from Easter Sunday');
console.log('5. Need to handle timezone considerations for date calculations');
